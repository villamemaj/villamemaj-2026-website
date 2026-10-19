import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getRooms } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Input = {
  message?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  locale?: unknown;
  website?: unknown;
  threadId?: unknown;
  requestHuman?: unknown;
};
const MAX_MESSAGE = 2000;
const LOCALES = new Set(["el", "en", "fr", "sq", "de"]);

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function genericReply(locale: string): string {
  const replies: Record<string, string> = {
    el: "Ευχαριστούμε για το μήνυμά σας. Η ομάδα της Villa Memaj θα επικοινωνήσει μαζί σας. Για επείγουσες ερωτήσεις κράτησης, στείλτε email στο info@villamemaj.com.",
    en: "Thank you for your message. The Villa Memaj team will follow up. For urgent booking questions, email info@villamemaj.com.",
    fr: "Merci pour votre message. L’équipe de Villa Memaj vous répondra. Pour une question urgente, écrivez à info@villamemaj.com.",
    sq: "Faleminderit për mesazhin. Ekipi i Villa Memaj do t'ju kontaktojë. Për pyetje urgjente shkruani te info@villamemaj.com.",
    de: "Vielen Dank für Ihre Nachricht. Das Team der Villa Memaj meldet sich. Bei dringenden Fragen schreiben Sie an info@villamemaj.com.",
  };
  return replies[locale] || replies.en;
}
function extractResponseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const obj = payload as { output_text?: unknown; output?: unknown };
  if (typeof obj.output_text === "string") return obj.output_text.trim();
  if (!Array.isArray(obj.output)) return "";
  const texts: string[] = [];
  for (const item of obj.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const node of content) {
      if (node && typeof node === "object" && (node as { type?: unknown }).type === "output_text") {
        const value = (node as { text?: unknown }).text;
        if (typeof value === "string") texts.push(value);
      }
    }
  }
  return texts.join("\n").trim();
}
async function notifySlack(webhook: string | undefined, reference: string, locale: string) {
  if (!webhook) return;
  try {
    const url = new URL(webhook);
    if (url.protocol !== "https:" || url.hostname !== "hooks.slack.com") return;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "New Villa Memaj support conversation " + reference + " (" + locale + "). Open the private CRM Support Inbox to read and respond." }),
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
    });
  } catch {
    // The request is still stored in Supabase; Slack is only an alert channel.
  }
}

export async function POST(request: Request) {
  let input: Input;
  try { input = await request.json() as Input; }
  catch { return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 }); }

  if (text(input.website, 300)) return NextResponse.json({ ok: true, reply: genericReply("en"), threadId: null });
  const message = text(input.message, MAX_MESSAGE);
  const name = text(input.name, 120) || null;
  const email = text(input.email, 254).toLowerCase();
  const phone = text(input.phone, 40) || null;
  const rawLocale = text(input.locale, 8);
  const locale = LOCALES.has(rawLocale) ? rawLocale : "en";
  const requestHuman = input.requestHuman === true || /\b(human|person|real agent|representative|staff member|μίλησε με άνθρωπο|υπάλληλο|άνθρωπο|agent humain|conseiller|njeri|punonjës|mitarbeiter|menschen)\b/i.test(message);
  const requestedId = text(input.threadId, 80);
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (requestedId && !uuid.test(requestedId)) return NextResponse.json({ ok: false, error: "invalid_thread" }, { status: 400 });
  if (message.length < 8) return NextResponse.json({ ok: false, error: "message_too_short" }, { status: 400 });
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "support_temporarily_unavailable" }, { status: 503 });

  const clientIp = (request.headers.get("x-vercel-forwarded-for") || "unknown").split(",")[0].trim().slice(0, 100);
  const fingerprint = createHash("sha256").update(clientIp || "unknown").digest("hex");
  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  type Conversation = { id: string; locale: string; status: string; guest_contact_email: string | null; guest_name: string | null; guest_phone: string | null; requested_human: boolean };
  let conversation: Conversation;

  if (requestedId) {
    const { data, error } = await supabase.from("guest_support_conversations")
      .select("id,locale,status,guest_contact_email,guest_name,guest_phone,requested_human,client_fingerprint_hash")
      .eq("id", requestedId).eq("client_fingerprint_hash", fingerprint)
      .in("status", ["open", "waiting_staff"]).maybeSingle();
    if (error || !data) return NextResponse.json({ ok: false, error: "thread_not_found" }, { status: 404 });

    const { count, error: countError } = await supabase.from("guest_support_messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", requestedId).eq("role", "guest").gte("created_at", cutoff);
    if (countError) return NextResponse.json({ ok: false, error: "support_temporarily_unavailable" }, { status: 503 });
    if ((count ?? 0) >= 10) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });

    conversation = data as Conversation;
    const update = await supabase.from("guest_support_conversations").update({
      status: requestHuman || conversation.requested_human ? "waiting_staff" : "open",
      requested_human: requestHuman || conversation.requested_human,
      guest_contact_email: conversation.guest_contact_email || email || null,
      guest_name: conversation.guest_name || name,
      guest_phone: conversation.guest_phone || phone,
      last_message_at: new Date().toISOString(),
    }).eq("id", conversation.id);
    if (update.error) return NextResponse.json({ ok: false, error: "support_temporarily_unavailable" }, { status: 503 });
  } else {
    const { count, error } = await supabase.from("guest_support_conversations")
      .select("id", { count: "exact", head: true })
      .eq("client_fingerprint_hash", fingerprint).gte("created_at", cutoff);
    if (error) return NextResponse.json({ ok: false, error: "support_temporarily_unavailable" }, { status: 503 });
    if ((count ?? 0) >= 8) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });

    const { data, error: createError } = await supabase.from("guest_support_conversations").insert({
      locale, status: requestHuman ? "waiting_staff" : "open",
      ai_provider: null, guest_contact_email: email || null,
      guest_name: name, guest_phone: phone, requested_human: requestHuman,
      client_fingerprint_hash: fingerprint, last_message_at: new Date().toISOString(),
    }).select("id,locale,status,guest_contact_email,guest_name,guest_phone,requested_human").single();
    if (createError || !data) {
      console.error("Support conversation create failed", { code: createError?.code });
      return NextResponse.json({ ok: false, error: "support_temporarily_unavailable" }, { status: 503 });
    }
    conversation = data as Conversation;
  }

  const { error: messageError } = await supabase.from("guest_support_messages").insert({
    conversation_id: conversation.id,
    role: "guest",
    message,
    ai_provider: null,
    needs_staff: requestHuman,
  });
  if (messageError) {
    console.error("Support message insert failed", { code: messageError.code });
    return NextResponse.json({ ok: false, error: "support_temporarily_unavailable" }, { status: 503 });
  }

  const { data: policy } = await supabase.from("hotel_house_policies")
    .select("notification_emails,contact_email,check_in_time,check_out_time,smoking_allowed,pets_allowed,children_allowed,parties_allowed,quiet_hours,children_policy,internet_information,parking_information,damage_policy,additional_fees_note,arrival_instructions_en,arrival_instructions_el,local_guide_en,local_guide_el")
    .limit(1).maybeSingle();
  const recipients = Array.from(new Set([
    ...((policy?.notification_emails as string[] | null) ?? []),
    typeof policy?.contact_email === "string" ? policy.contact_email : "",
  ].map(v => v.trim().toLowerCase()).filter(v => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))));

  const reference = conversation.id.slice(-8).toUpperCase();
  for (const recipient of recipients) {
    const { error } = await supabase.from("email_outbox").insert({
      booking_id: null,
      kind: "guest_support_message",
      to_email: recipient,
      to_name: null,
      subject: "Villa Memaj support " + reference + ": " + message.split(/\r?\n/, 1)[0].slice(0, 100),
      body_text: [
        "Support reference: " + reference,
        "Language: " + locale,
        "Guest name: " + (conversation.guest_name || name || "not provided"),
        "Guest email: " + (conversation.guest_contact_email || email || "not provided"),
        "Guest phone: " + (conversation.guest_phone || phone || "not provided"),
        "",
        message,
        "",
        "Open the private CRM support inbox to reply. Never request payment-card numbers or bank codes.",
      ].join("\n"),
      scheduled_for: new Date().toISOString(),
    });
    if (error) console.error("Support owner email queue failed", { code: error.code, reference });
  }
  await notifySlack(process.env.SLACK_WEBHOOK_URL, reference, locale);

  let reply = genericReply(locale);
  let aiAnswered = false;
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.GUEST_SUPPORT_AI_MODEL?.trim() || "gpt-4.1-mini";
  if (apiKey && !requestHuman && !conversation.requested_human) {
    try {
      const rooms = await getRooms();
      const facts = {
        checkIn: policy?.check_in_time ?? null, checkOut: policy?.check_out_time ?? null,
        smokingAllowed: policy?.smoking_allowed ?? null, petsAllowed: policy?.pets_allowed ?? null,
        childrenAllowed: policy?.children_allowed ?? null, partiesAllowed: policy?.parties_allowed ?? null,
        quietHours: policy?.quiet_hours ?? null, childrenPolicy: policy?.children_policy ?? null,
        internet: policy?.internet_information ?? null, parking: policy?.parking_information ?? null,
        damagePolicy: policy?.damage_policy ?? null, additionalFees: policy?.additional_fees_note ?? null,
        arrivalInstructions: locale === "el" ? policy?.arrival_instructions_el : policy?.arrival_instructions_en,
        localGuide: locale === "el" ? policy?.local_guide_el : policy?.local_guide_en,
        roomNames: rooms.map(r => locale === "el" ? r.name_el : r.name_en),
      };
      const { data: history } = await supabase.from("guest_support_messages")
        .select("role,message").eq("conversation_id", conversation.id)
        .in("role", ["guest", "assistant"]).order("created_at", { ascending: false }).limit(10);
      const inputHistory = (history ?? []).reverse().map(m => ({
        role: m.role === "assistant" ? "assistant" : "user", content: m.message,
      }));
      const language = ({ el: "Greek", en: "English", fr: "French", sq: "Albanian", de: "German" } as Record<string,string>)[locale] || "English";
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST", headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          instructions: [
            "You are the guest-support assistant for Villa Memaj, an accommodation property in Albania.",
            "Reply in " + language + ". Use only supplied property facts; if a fact is blank, ask staff to confirm.",
            "Never invent prices, availability, transport schedules, attraction hours, legal advice, cancellation/refund outcomes.",
            "Do not promise to create/change/cancel bookings, take payments or issue refunds. Hand those off to staff.",
            "Never ask for card data, passwords or one-time codes. Max 140 words, warm and clear.",
            "Verified property facts: " + JSON.stringify(facts),
          ].join("\n"),
          input: inputHistory, max_output_tokens: 350, store: false,
        }),
        cache: "no-store", signal: AbortSignal.timeout(9000),
      });
      const payload = await response.json().catch(() => null);
      const answer = response.ok ? extractResponseText(payload) : "";
      if (answer && answer.length <= 2500) { reply = answer; aiAnswered = true; }
      else console.error("Guest AI no usable answer", { status: response.status, reference });
    } catch {
      console.error("Guest AI request failed", { reference });
    }
  }

  const { error: assistantError } = await supabase.from("guest_support_messages").insert({
    conversation_id: conversation.id,
    role: aiAnswered ? "assistant" : "system",
    message: reply,
    ai_provider: aiAnswered ? model : null,
    needs_staff: !aiAnswered,
  });
  if (assistantError) console.error("Support reply store failed", { code: assistantError.code, reference });
  await supabase.from("guest_support_conversations").update({
    status: aiAnswered ? "open" : "waiting_staff",
    ai_provider: aiAnswered ? model : null,
    requested_human: !aiAnswered || requestHuman || conversation.requested_human,
    last_message_at: new Date().toISOString(),
  }).eq("id", conversation.id);

  return NextResponse.json({ ok: true, threadId: conversation.id, reference, reply, handedOff: !aiAnswered });
}
