import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { dispatchQueuedEmails } from "@/lib/email/dispatch";
import { dispatchQueuedSms } from "@/lib/notifications/sms";
import { dispatchOwnerNotifications } from "@/lib/notifications/owner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const codePattern = /^VM-\d{2}-\d{4,8}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: { bookingId?: unknown; bookingCode?: unknown; guestEmail?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() : "";
  const bookingCode = typeof body.bookingCode === "string" ? body.bookingCode.trim() : "";
  const guestEmail = typeof body.guestEmail === "string" ? body.guestEmail.trim().toLowerCase() : "";
  if (!uuidPattern.test(bookingId) || !codePattern.test(bookingCode) || !emailPattern.test(guestEmail)) {
    return NextResponse.json({ error: "Invalid booking reference." }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "Notifications are not configured." }, { status: 503 });

  const forwarded = request.headers.get("x-real-ip")?.trim() || request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown";
  const salt = process.env.SUPPORT_RATE_LIMIT_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-16) || process.env.CRON_SECRET || "booking-notification-rate-limit";
  const fingerprint = createHash("sha256").update(salt + ":booking-notification:" + forwarded).digest("hex");
  const { data: allowed, error: limitError } = await supabase.rpc("consume_support_rate_limit", {
    p_fingerprint_hash: fingerprint,
    p_window_seconds: 3600,
    p_max_hits: 8,
  });
  if (limitError || allowed !== true) return NextResponse.json({ error: "Please wait before retrying." }, { status: 429 });

  const { data: booking, error } = await supabase
    .from("hotel_bookings")
    .select("id,code,guest_email,status")
    .eq("id", bookingId)
    .maybeSingle();

  // Same response for invalid, mismatched and ineligible bookings avoids a booking-existence oracle.
  if (error || !booking || String(booking.code || "").toUpperCase() !== bookingCode.toUpperCase() ||
      String(booking.guest_email || "").trim().toLowerCase() !== guestEmail ||
      !["request", "hold"].includes(booking.status)) {
    return NextResponse.json({ error: "Booking request not found." }, { status: 404 });
  }

  const [emails, sms, owner] = await Promise.all([
    dispatchQueuedEmails(10, bookingId),
    dispatchQueuedSms(10, bookingId),
    dispatchOwnerNotifications(10, bookingId),
  ]);

  // Provider-not-configured results do not fail booking submission; messages stay queued
  // for the protected scheduled worker and are never falsely reported to the guest as sent.
  console.info("Booking notification dispatch", {
    bookingId,
    emailConfigured: emails.configured,
    emailSent: emails.sent,
    smsConfigured: sms.configured,
    smsSent: sms.sent,
    ownerChannelsConfigured: owner.configured,
    ownerAlertsSent: owner.sent,
  });
  return NextResponse.json({ ok: true, queuedForDelivery: !emails.configured || !sms.configured || !owner.configured });
}
