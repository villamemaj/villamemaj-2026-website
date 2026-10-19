import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { dispatchQueuedEmails } from "@/lib/email/dispatch";
import { dispatchQueuedSms } from "@/lib/notifications/sms";
import { dispatchOwnerNotifications } from "@/lib/notifications/owner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type StripeEvent = {
  id: string;
  type: string;
  data?: { object?: Record<string, unknown> };
};

function verifyStripeSignature(payload: string, header: string, secret: string): boolean {
  const parts = header.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) return false;
  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber) || Math.abs(Date.now() / 1000 - timestampNumber) > 300) return false;
  const expected = createHmac("sha256", secret).update(timestamp + "." + payload, "utf8").digest();
  return signatures.some((signature) => {
    if (!/^[0-9a-f]{64}$/i.test(signature)) return false;
    const received = Buffer.from(signature, "hex");
    return received.length === expected.length && timingSafeEqual(received, expected);
  });
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") || "";
  if (!verifyStripeSignature(payload, signature, secret)) {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid Stripe event payload." }, { status: 400 });
  }
  if (!event.id || !event.type || !event.data?.object) {
    return NextResponse.json({ error: "Incomplete Stripe event." }, { status: 400 });
  }

  const supported = new Set([
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "checkout.session.async_payment_failed",
    "checkout.session.expired",
  ]);
  if (!supported.has(event.type)) return NextResponse.json({ received: true, ignored: true });

  const session = event.data.object;
  const transactionId = stringValue((session.metadata as Record<string, unknown> | undefined)?.transaction_id);
  const bookingId = stringValue((session.metadata as Record<string, unknown> | undefined)?.booking_id);
  const sessionId = stringValue(session.id);
  if (!transactionId || !bookingId || !sessionId) {
    return NextResponse.json({ error: "Checkout session is missing booking metadata." }, { status: 400 });
  }

  let outcome: "succeeded" | "failed" | "cancelled" | "pending" = "pending";
  if (event.type === "checkout.session.expired") outcome = "cancelled";
  else if (event.type === "checkout.session.async_payment_failed") outcome = "failed";
  else if (event.type === "checkout.session.async_payment_succeeded") outcome = "succeeded";
  else if (event.type === "checkout.session.completed") outcome = session.payment_status === "paid" ? "succeeded" : "pending";

  const amountTotal = typeof session.amount_total === "number" ? session.amount_total : null;
  const currency = stringValue(session.currency)?.toUpperCase() || null;
  const paymentIntent = typeof session.payment_intent === "string"
    ? session.payment_intent
    : stringValue((session.payment_intent as Record<string, unknown> | null)?.id);
  const payloadHash = createHash("sha256").update(payload).digest("hex");
  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "Payment storage is not configured." }, { status: 503 });

  const { data, error } = await supabase.rpc("apply_stripe_checkout_event", {
    p_provider_event_id: event.id,
    p_event_type: event.type,
    p_transaction_id: transactionId,
    p_booking_id: bookingId,
    p_session_id: sessionId,
    p_payment_intent_id: paymentIntent,
    p_amount_minor: amountTotal,
    p_currency: currency,
    p_outcome: outcome,
    p_payload_sha256: payloadHash,
  });

  if (error) {
    console.error("Stripe webhook reconciliation failed", { eventId: event.id, code: error.code });
    return NextResponse.json({ error: "Could not reconcile payment event." }, { status: 500 });
  }
  // A verified Stripe payment changes booking status and enqueues guest/owner messages.
  // Dispatch only the affected booking; never drain unrelated guests' queue on a webhook.
  if (outcome !== "pending") {
    const dispatchResults = await Promise.allSettled([
      dispatchQueuedEmails(10, bookingId),
      dispatchQueuedSms(10, bookingId),
      dispatchOwnerNotifications(10, bookingId),
    ]);
    console.info("Stripe booking notifications processed", {
      eventId: event.id,
      bookingId,
      channelsAttempted: dispatchResults.length,
      failedCalls: dispatchResults.filter((item) => item.status === "rejected").length,
    });
  }

  return NextResponse.json({ received: true, result: data });
}
