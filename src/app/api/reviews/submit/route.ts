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
};

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  let input: ReviewInput;
  try {
    input = await request.json() as ReviewInput;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const token = text(input.token, 80);
  const displayName = text(input.displayName, 60) || "Verified guest";
  const title = text(input.title, 120);
  const review = text(input.review, 3000);
  const rating = Number(input.rating);
  const localeCandidate = text(input.locale, 8);
  const locale = ["el", "en", "fr", "sq", "de"].includes(localeCandidate) ? localeCandidate : "en";

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
    return NextResponse.json({ ok: false, error: "invalid_or_expired_link" }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || title.length < 4 || review.length < 20) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "temporarily_unavailable" }, { status: 503 });

  // Review link is unique per booking and works only after staff records check-out.
  const { data: booking, error: bookingError } = await supabase
    .from("hotel_bookings")
    .select("id,guest_language,status,checked_out_at,review_token")
    .eq("review_token", token)
    .maybeSingle();

  if (bookingError || !booking || (booking.status !== "checked_out" && !booking.checked_out_at)) {
    return NextResponse.json({ ok: false, error: "invalid_or_expired_link" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("hotel_guest_reviews")
    .select("id")
    .eq("booking_id", booking.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: false, error: "already_submitted" }, { status: 409 });
  }

  const { data: created, error: createError } = await supabase
    .from("hotel_guest_reviews")
    .insert({
      booking_id: booking.id,
      guest_display_name: displayName,
      rating,
      title,
      review_text: review,
      locale,
      status: "pending",
    })
    .select("id")
    .single();

  if (createError || !created) {
    if (createError?.code === "23505") {
      return NextResponse.json({ ok: false, error: "already_submitted" }, { status: 409 });
    }
    console.error("Guest review submission failed", { code: createError?.code });
    return NextResponse.json({ ok: false, error: "temporarily_unavailable" }, { status: 503 });
  }

  const { data: settings } = await supabase
    .from("hotel_house_policies")
    .select("notification_emails,contact_email")
    .limit(1)
    .maybeSingle();
  const recipients = Array.from(new Set([
    ...((settings?.notification_emails as string[] | null) ?? []),
    typeof settings?.contact_email === "string" ? settings.contact_email : "",
  ].map((email) => email.trim().toLowerCase()).filter((email) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))));

  for (const recipient of recipients) {
    const { error } = await supabase.from("email_outbox").insert({
      kind: "guest_review_moderation",
      to_email: recipient,
      subject: "Review awaiting approval · " + rating + "/5",
      body_text: [
        "A guest review is waiting for moderation.",
        "Rating: " + rating + "/5",
        "Title: " + title,
        "Display name: " + displayName,
        "",
        review,
        "",
        "Open the Extranet Guest Reviews workspace to publish or reject this review.",
      ].join("\n"),
      dedupe_key: "review:" + created.id + ":moderation:" + recipient,
    });
    if (error) console.error("Review moderation email queue failed", { code: error.code });
  }

  return NextResponse.json({
    ok: true,
    status: "pending_moderation",
    message: locale === "el"
      ? "Ευχαριστούμε! Η αξιολόγησή σας θα δημοσιευτεί μετά από έλεγχο."
      : locale === "fr"
        ? "Merci ! Votre avis sera publié après modération."
        : locale === "sq"
          ? "Faleminderit! Vlerësimi do të publikohet pas moderimit."
          : locale === "de"
            ? "Vielen Dank! Ihre Bewertung wird nach Prüfung veröffentlicht."
            : "Thank you! Your review will be published after moderation.",
  }, { status: 201 });
}
