import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReviewInput = {
  token?: unknown;
  displayName?: unknown;
  rating?: unknown;
  title?: unknown;
  review?: unknown;
  locale?: unknown;
  consentToPublish?: unknown;
  website?: unknown;
};

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function successMessage(locale: string, consent: boolean) {
  const copy: Record<string, { publicReview: string; privateFeedback: string }> = {
    en: {
      publicReview: "Thank you. Your review was received and will be shown on our website only after moderation.",
      privateFeedback: "Thank you. Your feedback was received privately and will not be published because you did not give publication consent.",
    },
    el: {
      publicReview: "Ευχαριστούμε. Η αξιολόγηση λήφθηκε και θα εμφανιστεί στον ιστότοπό μας μόνο μετά από έλεγχο.",
      privateFeedback: "Ευχαριστούμε. Το σχόλιό σας καταχωρήθηκε ιδιωτικά και δεν θα δημοσιευτεί χωρίς τη συγκατάθεσή σας.",
    },
    fr: {
      publicReview: "Merci. Votre avis a été reçu et ne sera affiché sur notre site qu’après modération.",
      privateFeedback: "Merci. Votre retour a été reçu à titre privé et ne sera pas publié sans votre consentement.",
    },
    sq: {
      publicReview: "Faleminderit. Vlerësimi u mor dhe do të shfaqet në faqen tonë vetëm pas moderimit.",
      privateFeedback: "Faleminderit. Komenti juaj u mor privatisht dhe nuk do të publikohet pa pëlqimin tuaj.",
    },
    de: {
      publicReview: "Vielen Dank. Ihre Bewertung wurde erhalten und wird erst nach Moderation auf unserer Website angezeigt.",
      privateFeedback: "Vielen Dank. Ihr Feedback wurde vertraulich erhalten und wird ohne Ihre Einwilligung nicht veröffentlicht.",
    },
  };
  const language = copy[locale] || copy.en;
  return consent ? language.publicReview : language.privateFeedback;
}

export async function POST(request: Request) {
  let input: ReviewInput;
  try { input = await request.json() as ReviewInput; }
  catch { return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 }); }

  // Honeypot: respond normally but discard scripted submissions.
  if (text(input.website, 200)) return NextResponse.json({ ok: true, message: successMessage("en", false) });

  const token = text(input.token, 80);
  const displayName = text(input.displayName, 120) || "Verified guest";
  const title = text(input.title, 160);
  const body = text(input.review, 3000);
  const rating = Number(input.rating);
  const localeCandidate = text(input.locale, 8);
  const locale = ["el", "en", "fr", "sq", "de"].includes(localeCandidate) ? localeCandidate : "en";
  const consentToPublish = input.consentToPublish === true;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuid.test(token)) return NextResponse.json({ ok: false, error: "invalid_or_expired_link" }, { status: 400 });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || title.length < 4 || body.length < 20) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "temporarily_unavailable" }, { status: 503 });

  // A per-booking token is created by the database and only accepted after check-out.
  const { data: booking, error: bookingError } = await supabase.from("hotel_bookings")
    .select("id,guest_name,status,checked_out_at,check_out,review_token")
    .eq("review_token", token).maybeSingle();
  if (bookingError || !booking || (booking.status !== "checked_out" && !booking.checked_out_at)) {
    return NextResponse.json({ ok: false, error: "invalid_or_expired_link" }, { status: 404 });
  }

  const { data: existing, error: existingError } = await supabase.from("guest_testimonials")
    .select("id").eq("booking_id", booking.id).maybeSingle();
  if (existingError) {
    console.error("Review duplicate check failed", { code: existingError.code });
    return NextResponse.json({ ok: false, error: "temporarily_unavailable" }, { status: 503 });
  }
  if (existing) return NextResponse.json({ ok: false, error: "already_submitted" }, { status: 409 });

  const { data: created, error: insertError } = await supabase.from("guest_testimonials").insert({
    booking_id: booking.id,
    display_name: displayName,
    rating,
    title,
    body,
    locale,
    source: "direct_guest",
    consent_to_publish: consentToPublish,
    is_published: false,
    moderation_status: "pending",
  }).select("id").single();

  if (insertError || !created) {
    if (insertError?.code === "23505") return NextResponse.json({ ok: false, error: "already_submitted" }, { status: 409 });
    console.error("Guest testimonial submission failed", { code: insertError?.code });
    return NextResponse.json({ ok: false, error: "temporarily_unavailable" }, { status: 503 });
  }

  const { data: settings } = await supabase.from("hotel_house_policies")
    .select("notification_emails,contact_email").limit(1).maybeSingle();
  const recipients = Array.from(new Set([
    ...((settings?.notification_emails as string[] | null) ?? []),
    typeof settings?.contact_email === "string" ? settings.contact_email : "",
  ].map(v => v.trim().toLowerCase()).filter(v => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))));

  for (const recipient of recipients) {
    const { error } = await supabase.from("email_outbox").insert({
      booking_id: null,
      kind: "guest_review_moderation",
      to_email: recipient,
      to_name: null,
      subject: "Guest review awaiting approval · " + rating + "/5",
      body_text: [
        "A first-party guest testimonial is waiting for moderation.",
        "Consent to public display: " + (consentToPublish ? "yes" : "no"),
        "Rating: " + rating + "/5",
        "Display name: " + displayName,
        "Title: " + title,
        "",
        body,
        "",
        "Open the Extranet Guest Reviews workspace. Only consented and approved reviews may be published.",
      ].join("\n"),
      status: "pending",
      scheduled_for: new Date().toISOString(),
    });
    if (error) console.error("Review moderation email queue failed", { code: error.code });
  }

  return NextResponse.json({
    ok: true,
    status: consentToPublish ? "pending_moderation" : "private_feedback",
    message: successMessage(locale, consentToPublish),
  }, { status: 201 });
}
