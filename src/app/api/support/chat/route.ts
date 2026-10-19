import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getFAQItems, getPolicyDocument, type FAQItem } from "@/lib/legal-content";
import { isLocale, type Locale } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ProviderAnswer = { provider: string; answer: string } | null;

function needsHuman(text: string): boolean {
  return /\b(human|person|staff|manager|owner|complaint|refund|chargeback|payment failed|cancel my|change my booking|emergency|urgent|safety|allergy|medical|lawsuit|data breach|gdpr|personal data)\b/i.test(text);
}

function fallbackAnswer(message: string, locale: Locale): string {
  const questions = getFAQItems(locale);
  const normalized = message.toLowerCase();
  const score = (item: FAQItem) => {
    const question = (item.q + " " + item.a).toLowerCase();
    const terms = normalized.split(/[^a-z0-9\u00c0-\u024f\u0370-\u03ff]+/i).filter((word) => word.length >= 4);
    return terms.reduce((sum, term) => sum + (question.includes(term) ? 1 : 0), 0);
  };
  const best = questions.map((item) => ({ item, score: score(item) })).sort((a, b) => b.score - a.score)[0];
  const threshold = locale === "el" ? 1 : 1;
  if (best && best.score >= threshold) return best.item.a;

  const contact: Record<Locale, string> = {
    en: "I can help with general information about Villa Memaj, booking terms, cancellation rules and check-in. For a booking-specific change, payment issue or complaint, I’ll flag this for the property team. You can also write to info@villamemaj.com.",
    el: "Μπορώ να βοηθήσω με γενικές πληροφορίες για τη Villa Memaj, τους όρους κράτησης, τις ακυρώσεις και την άφιξη. Για αλλαγή συγκεκριμένης κράτησης, πληρωμή ή παράπονο, θα ενημερώσω την ομάδα του καταλύματος. Μπορείτε επίσης να γράψετε στο info@villamemaj.com.",
    fr: "Je peux vous aider avec les informations générales, les conditions de réservation, les annulations et l’arrivée. Pour modifier une réservation, un problème de paiement ou une réclamation, je transmettrai votre demande à l’équipe. Vous pouvez aussi écrire à info@villamemaj.com.",
    sq: "Mund t’ju ndihmoj me informacion të përgjithshëm, kushtet e rezervimit, anulimet dhe regjistrimin. Për ndryshim rezervimi, problem pagese ose ankesë, do ta kaloj kërkesën te ekipi. Mund të shkruani edhe në info@villamemaj.com.",
    de: "Ich helfe bei allgemeinen Informationen, Buchungsbedingungen, Stornierungen und Anreise. Bei Buchungsänderungen, Zahlungsproblemen oder Beschwerden leite ich die Anfrage an das Team weiter. Sie können auch an info@villamemaj.com schreiben.",
    it: "Posso aiutarti con informazioni generali, condizioni di prenotazione, cancellazioni e check-in. Per modifiche a una prenotazione, problemi di pagamento o reclami, inoltrerò la richiesta al team. Puoi anche scrivere a info@villamemaj.com.",
  };
  return contact[locale];
}

function policyContext(locale: Locale): string {
  const docs = ["terms", "cancellation", "houseRules", "payments", "privacy"]
    .map((slug) => getPolicyDocument(slug, locale) ?? getPolicyDocument(slug, "en"))
    .filter(Boolean);
  const relevantFaqs = getFAQItems(locale);
  return [
    ...docs.map((doc) => doc ? doc.title + "\n" + doc.sections.map((s) => s.heading + "\n" + s.paragraphs.join("\n")).join("\n") : ""),
    "FAQ:\n" + relevantFaqs.map((item) => item.q + "\n" + item.a).join("\n"),
  ].join("\n\n").slice(0, 22000);
}

async function answerWithOpenAI(message: string, locale: Locale): Promise<ProviderAnswer> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini";
  const instructions = [
    "You are the guest support assistant for Villa Memaj, an accommodation provider in Albania.",
    "Answer in the guest's selected language. Use only the property information below. Be courteous and concise.",
    "Never claim to see or change a booking, never state payment is received, never approve refunds or exceptions, never invent inventory, fees, flight facts, tax rates, amenities or legal guarantees.",
    "Do not ask for payment card numbers, security codes, authentication codes, passwords or identity documents.",
    "You have no access to private booking records or staff CRM data. Do not imply otherwise.",
    "For booking-specific changes, payment failures, cancellation disputes, complaints, legal/privacy requests, urgent/safety concerns or any uncertain answer, tell the guest the property team must confirm and request human support escalation.",
    "Current property knowledge:\n" + policyContext(locale),
  ].join("\n\n");
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ model, instructions, input: message, max_output_tokens: 320 }),
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return null;
    const data = await response.json() as { output_text?: string; output?: { content?: { type?: string; text?: string }[] }[] };
    const answer = data.output_text ?? data.output?.flatMap((item) => item.content ?? []).filter((part) => part.type === "output_text" && part.text).map((part) => part.text).join("\n") ?? "";
    return answer.trim() ? { provider: model, answer: answer.trim().slice(0, 4000) } : null;
  } catch {
    return null;
  }
}

async function answerWithGemini(message: string, locale: Locale): Promise<ProviderAnswer> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const prompt = [
    "You are the Villa Memaj guest support assistant. Answer in the selected language and use only the property knowledge below.",
    "Do not claim access to private bookings or that payments/refunds/changes are approved. Never request full card data, security codes or passwords. Escalate booking-specific changes, money issues, complaints, safety, privacy and uncertain answers to the property team.",
    "Property knowledge:\n" + policyContext(locale),
    "Guest language: " + locale,
    "Guest question: " + message,
  ].join("\n\n");
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent?key=" + encodeURIComponent(key), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 320, temperature: 0.2 } }),
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return null;
    const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const answer = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n").trim() ?? "";
    return answer ? { provider: model, answer: answer.slice(0, 4000) } : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let body: { message?: unknown; locale?: unknown; conversationId?: unknown; requestHuman?: unknown; contactEmail?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }

  const message = typeof body.message === "string" ? body.message.trim().slice(0, 3000) : "";
  const locale = typeof body.locale === "string" && isLocale(body.locale) ? body.locale as Locale : "en";
  let requestedId = typeof body.conversationId === "string" && uuidPattern.test(body.conversationId) ? body.conversationId : randomUUID();
  const requestHuman = body.requestHuman === true;
  const contactEmail = typeof body.contactEmail === "string" && emailPattern.test(body.contactEmail.trim()) ? body.contactEmail.trim().toLowerCase() : null;

  if (message.length < 2) return NextResponse.json({ error: "Please enter a question." }, { status: 400 });
  if (requestHuman && body.contactEmail && !contactEmail) return NextResponse.json({ error: "Enter a valid email address or leave it blank." }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "Guest support is temporarily unavailable. Please email info@villamemaj.com." }, { status: 503 });

  const forwarded = request.headers.get("x-real-ip")?.trim() || request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown";
  const salt = process.env.SUPPORT_RATE_LIMIT_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-16) || process.env.CRON_SECRET || "support-rate-limit";
  const fingerprint = createHash("sha256").update(salt + ":" + forwarded).digest("hex");
  const { data: allowed, error: limitError } = await supabase.rpc("consume_support_rate_limit", {
    p_fingerprint_hash: fingerprint,
    p_window_seconds: 60,
    p_max_hits: 8,
  });
  if (limitError || allowed !== true) return NextResponse.json({ error: "Please wait a minute before sending another question." }, { status: 429 });

  const { data: existingConversation, error: existingConversationError } = await supabase
    .from("guest_support_conversations")
    .select("id,client_fingerprint_hash")
    .eq("id", requestedId)
    .maybeSingle();
  if (existingConversationError) return NextResponse.json({ error: "Could not start the support conversation." }, { status: 500 });
  if (existingConversation && existingConversation.client_fingerprint_hash !== fingerprint) {
    // A conversation id copied from another browser must not allow cross-guest writes.
    requestedId = randomUUID();
  }

  const human = requestHuman || needsHuman(message);
  const chosenContact = contactEmail;
  const { error: conversationError } = await supabase.from("guest_support_conversations").upsert({
    id: requestedId,
    client_fingerprint_hash: fingerprint,
    locale,
    status: human ? "waiting_staff" : "open",
    requested_human: human,
    guest_contact_email: chosenContact,
    last_message_at: new Date().toISOString(),
  }, { onConflict: "id", ignoreDuplicates: true });

  if (conversationError) return NextResponse.json({ error: "Could not start the support conversation." }, { status: 500 });

  await supabase.from("guest_support_conversations").update({
    locale,
    last_message_at: new Date().toISOString(),
    ...(human ? { status: "waiting_staff", requested_human: true } : {}),
    ...(chosenContact ? { guest_contact_email: chosenContact } : {}),
  }).eq("id", requestedId);

  const { error: guestMessageError } = await supabase.from("guest_support_messages").insert({
    conversation_id: requestedId,
    role: "guest",
    message,
    needs_staff: human,
  });
  if (guestMessageError) return NextResponse.json({ error: "Could not save your message." }, { status: 500 });

  const generated = await answerWithOpenAI(message, locale) ?? await answerWithGemini(message, locale);
  const answer = generated?.answer || fallbackAnswer(message, locale);
  const providerName = generated?.provider || "property-faq-fallback";
  const escalate = human || (!generated && needsHuman(message));
  await supabase.from("guest_support_messages").insert({
    conversation_id: requestedId,
    role: "assistant",
    message: answer,
    ai_provider: providerName,
    needs_staff: escalate,
  });
  await supabase.from("guest_support_conversations").update({ last_message_at: new Date().toISOString(), ai_provider: providerName }).eq("id", requestedId);

  if (escalate) {
    const { error } = await supabase.from("owner_notification_outbox").insert({
      kind: "support_request_" + randomUUID(),
      payload: {
        title: "Guest support needs staff",
        conversation_id: requestedId,
        locale,
        message: message.slice(0, 700),
        contact_email: chosenContact,
        crm_url: "https://villamemaj-2026-website.vercel.app/admin/support",
      },
    });
    if (error) console.error("Support escalation queue insert failed", { conversationId: requestedId, code: error.code });
  }

  return NextResponse.json({
    conversationId: requestedId,
    answer,
    provider: providerName,
    needsStaff: escalate,
    message: escalate ? "Your request has been flagged for the property team. For urgent matters, contact the property directly." : undefined,
  });
}
