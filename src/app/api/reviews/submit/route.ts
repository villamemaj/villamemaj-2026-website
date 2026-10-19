import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isLocale } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { displayName?: unknown; title?: unknown; body?: unknown; rating?: unknown; locale?: unknown; consentToPublish?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const displayName = typeof body.displayName === "string" ? body.displayName.trim().slice(0, 120) : "";
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 160) : "";
  const review = typeof body.body === "string" ? body.body.trim().slice(0, 3000) : "";
  const rating = Number(body.rating);
  const locale = typeof body.locale === "string" && isLocale(body.locale) ? body.locale : "en";
  if (displayName.length < 1 || review.length < 10 || !Number.isInteger(rating) || rating < 1 || rating > 5 || body.consentToPublish !== true) {
    return NextResponse.json({ error: "A name, review, rating and publication consent are required." }, { status: 400 });
  }
  if (/\\b(?:VM-\\d{2}-\\d+|booking reference|card number|password|passport number)\\b/i.test(review)) {
    return NextResponse.json({ error: "Please remove booking references or sensitive personal information before submitting." }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "Review submission is temporarily unavailable." }, { status: 503 });
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const salt = process.env.SUPPORT_RATE_LIMIT_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-16) || process.env.CRON_SECRET || "review-rate-limit";
  const fingerprint = createHash("sha256").update(salt + ":" + forwarded).digest("hex");
  const { data: allowed, error: limitError } = await supabase.rpc("consume_support_rate_limit", {
    p_fingerprint_hash: fingerprint, p_window_seconds: 3600, p_max_hits: 4,
  });
  if (limitError || allowed !== true) return NextResponse.json({ error: "Please wait before submitting another review." }, { status: 429 });

  const { error } = await supabase.from("guest_testimonials").insert({
    display_name: displayName, title, body: review, rating, locale,
    source: "direct_guest", consent_to_publish: true, is_published: false,
  });
  if (error) return NextResponse.json({ error: "Could not save the review for moderation." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
