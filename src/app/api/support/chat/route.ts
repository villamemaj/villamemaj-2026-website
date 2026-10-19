import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getRooms } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SupportInput = {
  message?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  locale?: unknown;
  website?: unknown;
  threadId?: unknown;
};

const MAX_MESSAGE = 2000;
const LOCALES = new Set(["el", "en", "fr", "sq", "de"]);

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function genericReply(locale: string): string {
  switch (locale) {
    case "el":
      return "Ευχαριστούμε για το μήνυμά σας. Το αίτημά σας καταχωρήθηκε και η ομάδα της Villa Memaj θα επικοινωνήσει μαζί σας. Για επείγουσες απορίες σχετικά με κράτηση, στείλτε email στο info@villamemaj.com.";
    case "fr":
      return "Merci pour votre message. Votre demande a été enregistrée et l’équipe de Villa Memaj vous répondra. Pour une question urgente concernant une réservation, écrivez à info@villamemaj.com.";
    case "sq":
      return "Faleminderit për mesazhin. Kërkesa juaj u regjistrua dhe ekipi i Villa Memaj do t'ju kontaktojë. Për çështje urgjente rezervimi, shkruani te info@villamemaj.com.";
    case "de":
      return "Vielen Dank für Ihre Nachricht. Ihre Anfrage wurde gespeichert und das Team der Villa Memaj meldet sich. Bei dringenden Fragen zur Buchung schreiben Sie an info@villamemaj.com.";
    default:
      return "Thank you for your message. Your request has been recorded and the Villa Memaj team will follow up. For urgent booking questions, email info@villamemaj.com.";
  }
}

function extractResponseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const object = payload as { output_text?: unknown; output?: unknown };
  if (typeof object.output_text === "string") return object.output_text.trim();
  if (!Array.isArray(object.output)) return "";
  const parts: string[] = [];
  for (const item of object.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const node of content) {
      if (node && typeof node === "object" && (node as { type?: unknown }).type === "output_text") {
        const value = (node as { text?: unknown }).text;
        if (typeof value === "string") parts.push(value);
      }
    }
  }
  return parts.join("\n").trim();
}

async function notifySlack(webhook: string | undefined, reference: string, message: string, locale: string) {
  if (!webhook) return;
  try {
    const url = new URL(webhook);
    if (url.protocol !== "https:" || url.hostname !== "hooks.slack.com") return;
    await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "New Villa Memaj support request " + reference + " (" + locale + ")\n" + message.slice(0, 900),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
    });
  } catch {
    // Support requests are durably stored and owner email remains the fallback.
  }
}

export async function POST(request: Request) {
  let input: SupportInput;
  try {
    input = await request.json() as SupportInput;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  // Quietly discard bot-trap submissions; never reflect the trap value.
  if (text(input.website, 300)) {
    return NextResponse.json({ ok: true, reply: genericReply("en"), reference: null });
  }

  const message = text(input.message, MAX_MESSAGE);
  const name = text(input.name, 100) || null;
  const email = text(input.email, 254).toLowerCase();
  const phone = text(input.phone, 40) || null;
  const localeCandidate = text(input.locale, 8);
  const locale = LOCALES.has(localeCandidate) ? localeCandidate : "en";
  const requestedThreadId = text(input.threadId, 80);
  if (requestedThreadId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestedThreadId)) {
    return NextResponse.json({ ok: false, error: "invalid_thread" }, { status: 400 });
  }

  if (message.length < 8) {
    return NextResponse.json({ ok: false, error: "message_too_short" }, { status: 400 });
  }
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "support_temporarily_unavailable" }, { status: 503 });
  }

  const forwarded = request.headers.get("x-vercel-forwarded-for")
    || request.headers.get("x-real-ip")
    || request.headers.get("x-forwarded-for")
    || "unknown";
  const ip = forwarded.split(",")[0].trim().slice(0, 100) || "unknown";
  const ipHash = createHash("sha256").update(ip).digest("hex");

  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  type SupportThread = { id: string; public_reference: string; guest_email: string | null; guest_name: string | null };
  let thread: SupportThread;

  if (requestedThreadId) {
    const { data: existingThread, error: existingError } = await supabase
      .from("hotel_guest_support_threads")
      .select("id,public_reference,guest_email,guest_name,status")
      .eq("id", requestedThreadId)
      .eq("request_ip_hash", ipHash)
      .in("status", ["open", "waiting_for_guest", "waiting_for_staff"])
      .maybeSingle();

    if (existingError || !existingThread) {
      return NextResponse.json({ ok: false, error: "thread_not_found" }, { status: 404 });
    }

    const { count: messageCount, error: messageCountError } = await supabase
      .from("hotel_guest_support_messages")
      .select("id", { count: "exact", head: true })
      .eq("thread_id", requestedThreadId)
      .eq("sender_role", "guest")
      .gte("created_at", cutoff);

    if (messageCountError) {
      return NextResponse.json({ ok: false, error: "support_temporarily_unavailable" }, { status: 503 });
    }
    if ((messageCount ?? 0) >= 10) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    thread = existingThread as SupportThread;
    await supabase.from("hotel_guest_support_threads").update({
      status: "open",
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", thread.id);
  } else {
    const { count, error: rateError } = await supabase
      .from("hotel_guest_support_threads")
      .select("id", { count: "exact", head: true })
      .eq("request_ip_hash", ipHash)
      .gte("created_at", cutoff);

    if (rateError) {
      console.error("Support rate-limit query failed", { code: rateError.code });
      return NextResponse.json({ ok: false, error: "support_temporarily_unavailable" }, { status: 503 });
    }
    if ((count ?? 0) >= 8) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const initialSubject = message.split(/\r?\n/, 1)[0].slice(0, 120) || "Guest question";
    const { data: newThread, error: threadError } = await supabase
      .from("hotel_guest_support_threads")
      .insert({
        guest_name: name,
        guest_email: email || null,
        guest_phone: phone,
        locale,
        subject: initialSubject,
        source: "website_chat",
        status: "open",
        request_ip_hash: ipHash,
        last_message_at: new Date().toISOString(),
      })
      .select("id,public_reference,guest_email,guest_name")
      .single();

    if (threadError || !newThread) {
      console.error("Support thread creation failed", { code: threadError?.code });
      return NextResponse.json({ ok: false, error: "support_temporarily_unavailable" }, { status: 503 });
    }
    thread = newThread as SupportThread;
  }

  const subject = message.split(/\r?\n/, 1)[0].slice(0, 120) || "Guest question";
  const { data: guestMessage, error: messageError } = await supabase
    .from("hotel_guest_support_messages")
    .insert({
      thread_id: thread.id,
      sender_role: "guest",
      content: message,
      delivery_channel: "web_chat",
    })
    .select("id")
    .single();

  if (messageError || !guestMessage) {
    console.error("Support message creation failed", { code: messageError?.code, reference: thread.public_reference });
    return NextResponse.json({ ok: false, error: "support_temporarily_unavailable" }, { status: 503 });
  }

  const { data: policy } = await supabase
    .from("hotel_house_policies")
    .select("notification_emails,contact_email,check_in_time,check_out_time,smoking_allowed,pets_allowed,children_allowed,parties_allowed,quiet_hours,children_policy,internet_information,parking_information,damage_policy,additional_fees_note,arrival_instructions_en,arrival_instructions_el,local_guide_en,local_guide_el")
    .limit(1)
    .maybeSingle();

  const recipients = Array.from(new Set([
    ...((policy?.notification_emails as string[] | null) ?? []),
    typeof policy?.contact_email === "string" ? policy.contact_email : "",
  ].map((value) => value.trim().toLowerCase()).filter((value) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value))));

  for (const recipient of recipients) {
    const { error } = await supabase.from("email_outbox").insert({
      kind: "guest_support_message",
      to_email: recipient,
      subject: "Guest support " + thread.public_reference + ": " + subject,
      body_text: [
        "Reference: " + thread.public_reference,
        "Language: " + locale,
        "Name: " + (thread.guest_name || name || "not provided"),
        "Email: " + (thread.guest_email || email || "not provided"),
        "Phone: " + (phone || "not provided"),
        "",
        message,
        "",
        "Open the CRM support inbox to reply. Do not send payment credentials over chat.",
      ].join("\n"),
      dedupe_key: "support:" + thread.id + ":message:" + guestMessage.id + ":owner:" + recipient,
    });
    if (error) console.error("Support owner alert queue failed", { code: error.code, reference: thread.public_reference });
  }

  await notifySlack(process.env.SLACK_WEBHOOK_URL, thread.public_reference, message, locale);

  // The assistant may answer simple property questions, but it cannot query or promise
  // live availability, change bookings, cancel reservations, issue refunds or take payments.
  // If no AI credential is configured, the durable human handoff still works.
  let reply = genericReply(locale);
  let aiAnswered = false;
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.GUEST_SUPPORT_AI_MODEL?.trim() || "gpt-4.1-mini";

  if (apiKey) {
    try {
      const rooms = await getRooms();
      const propertyFacts = {
        checkIn: policy?.check_in_time ?? null,
        checkOut: policy?.check_out_time ?? null,
        smokingAllowed: policy?.smoking_allowed ?? null,
        petsAllowed: policy?.pets_allowed ?? null,
        childrenAllowed: policy?.children_allowed ?? null,
        partiesAllowed: policy?.parties_allowed ?? null,
        quietHours: policy?.quiet_hours ?? null,
        childrenPolicy: policy?.children_policy ?? null,
        internet: policy?.internet_information ?? null,
        parking: policy?.parking_information ?? null,
        damagePolicy: policy?.damage_policy ?? null,
        extraFees: policy?.additional_fees_note ?? null,
        arrivalInstructions: locale === "el" ? policy?.arrival_instructions_el : policy?.arrival_instructions_en,
        localGuide: locale === "el" ? policy?.local_guide_el : policy?.local_guide_en,
        roomNames: rooms.map((room) => ({ name: locale === "el" ? room.name_el : room.name_en })),
      };

      const { data: recentHistory } = await supabase
        .from("hotel_guest_support_messages")
        .select("sender_role,content")
        .eq("thread_id", thread.id)
        .in("sender_role", ["guest", "assistant"])
        .order("created_at", { ascending: false })
        .limit(10);
      const conversationInput = (recentHistory ?? []).reverse().map((item) => ({
        role: item.sender_role === "assistant" ? "assistant" : "user",
        content: item.content,
      }));

      const instructions = [
        "You are the guest-support assistant for Villa Memaj, a small accommodation property in Albania.",
        "Reply in " + (locale === "el" ? "Greek" : locale === "fr" ? "French" : locale === "sq" ? "Albanian" : locale === "de" ? "German" : "English") + ".",
        "Use only the supplied property facts. If a fact is blank, say the team must confirm it.",
        "Never invent live availability, prices, transport schedules, attraction opening hours, legal advice, cancellation eligibility or refund outcomes.",
        "Do not claim to make or change reservations, take payments, cancel bookings or approve refunds. Direct booking and cancellation requests to the website forms or the staff team.",
        "Never ask for full card data, security codes, passwords or one-time banking codes.",
        "Keep the answer warm, short and helpful (max 140 words). If unsure, invite the guest to share a booking reference with staff.",
        "Verified property facts: " + JSON.stringify(propertyFacts),
      ].join("\n");

      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          instructions,
          input: conversationInput,
          max_output_tokens: 350,
          store: false,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(9000),
      });

      const data = await response.json().catch(() => null) as unknown;
      const answer = response.ok ? extractResponseText(data) : "";
      if (answer && answer.length <= 2500) {
        reply = answer;
        aiAnswered = true;
      } else {
        console.error("Guest-support AI returned no usable answer", { status: response.status, reference: thread.public_reference });
      }
    } catch {
      console.error("Guest-support AI request failed", { reference: thread.public_reference });
    }
  }

  const { error: assistantError } = await supabase
    .from("hotel_guest_support_messages")
    .insert({
      thread_id: thread.id,
      sender_role: aiAnswered ? "assistant" : "system",
      content: reply,
      model: aiAnswered ? model : null,
      delivery_channel: "web_chat",
      metadata: { automated: aiAnswered, handoff_required: !aiAnswered },
    });

  if (assistantError) {
    console.error("Support reply storage failed", { code: assistantError.code, reference: thread.public_reference });
  }

  await supabase
    .from("hotel_guest_support_threads")
    .update({
      status: aiAnswered ? "waiting_for_guest" : "waiting_for_staff",
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", thread.id);

  return NextResponse.json({
    ok: true,
    reference: thread.public_reference,
    threadId: thread.id,
    reply,
    handedOff: !aiAnswered,
  });
}
