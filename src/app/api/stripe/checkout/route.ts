import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getStaff } from "@/lib/admin/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BookingPayment = {
  id: string;
  code: string | null;
  status: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  total_price: number | string | null;
  currency_code: string;
  payment_status: string;
  payment_mode: string;
  payment_due: number | string | null;
  deposit_amount: number | string | null;
  amount_paid: number | string | null;
  balance_due: number | string | null;
  expires_at: string | null;
};

function money(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function POST(request: Request) {
  const { user, role } = await getStaff();
  if (!user || !role || !["owner", "manager", "receptionist", "accountant"].includes(role)) {
    return NextResponse.json({ error: "Not authorized to create a payment link." }, { status: 403 });
  }

  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Stripe is not configured. Add STRIPE_SECRET_KEY in the deployment environment." }, { status: 503 });
  }
  if (secret.startsWith("sk_live_") && process.env.STRIPE_LIVE_PAYMENTS_ENABLED !== "true") {
    return NextResponse.json({ error: "Live Stripe payments are disabled until the property owner explicitly enables them." }, { status: 503 });
  }

  let bookingId = "";
  try {
    const body = await request.json();
    bookingId = typeof body?.bookingId === "string" ? body.bookingId.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(bookingId)) {
    return NextResponse.json({ error: "A valid booking ID is required." }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Payment storage is not configured. Add the server-only Supabase service role key." }, { status: 503 });
  }

  const { data: booking, error: bookingError } = await supabase
    .from("hotel_bookings")
    .select("id, code, status, guest_name, guest_email, check_in, check_out, total_price, currency_code, payment_status, payment_mode, payment_due, deposit_amount, amount_paid, balance_due, expires_at")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError || !booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const b = booking as BookingPayment;
  if (!["confirmed", "hold"].includes(b.status)) {
    return NextResponse.json({ error: "Online payment is only available for a confirmed booking or an active payment hold." }, { status: 409 });
  }
  if (b.status === "hold" && b.expires_at && Date.parse(b.expires_at) <= Date.now()) {
    return NextResponse.json({ error: "This payment hold has expired. Reconfirm availability before requesting another payment link." }, { status: 409 });
  }
  if (b.status === "hold" && b.payment_status !== "unpaid" && b.payment_status !== "partially_paid") {
    return NextResponse.json({ error: "This payment hold is no longer payable." }, { status: 409 });
  }
  if (b.payment_mode !== "online") {
    return NextResponse.json({ error: "This booking is configured for payment at the property. Change its payment mode in the CRM first." }, { status: 409 });
  }

  const total = money(b.total_price);
  const paid = money(b.amount_paid);
  const balance = Math.max(0, money(b.balance_due ?? total - paid));
  const scheduledDue = money(b.payment_due);
  const deposit = money(b.deposit_amount);
  const amount = paid <= 0 && deposit > 0 && scheduledDue > 0 ? Math.min(deposit, balance) : (scheduledDue > 0 ? Math.min(scheduledDue, balance) : balance);
  const currency = String(b.currency_code || "").toLowerCase();

  if (!Number.isFinite(amount) || amount <= 0 || balance <= 0) {
    return NextResponse.json({ error: "There is no outstanding amount to collect." }, { status: 409 });
  }
  if (!["eur", "all"].includes(currency)) {
    return NextResponse.json({ error: "This booking currency is not supported by the current payment setup." }, { status: 422 });
  }

  const transactionId = randomUUID();
  const idempotencyKey = randomUUID();
  const amountMinor = Math.round(amount * 100);
  const requestOrigin = new URL(request.url).origin;
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || (process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : requestOrigin);
  const origin = new URL(configuredOrigin).origin;
  const locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE === "en" ? "en" : "el";
  const successUrl = new URL("/" + locale + "/payment/result?status=success", origin).toString();
  const cancelUrl = new URL("/" + locale + "/payment/result?status=cancelled", origin).toString();

  const { error: insertError } = await supabase.from("hotel_payment_transactions").insert({
    id: transactionId,
    booking_id: b.id,
    kind: "charge",
    provider: "stripe",
    method: "card",
    status: "initiated",
    amount: amount.toFixed(2),
    currency_code: b.currency_code,
    idempotency_key: idempotencyKey,
    recorded_by: user.id,
    notes: "Stripe Checkout payment link created by CRM staff.",
  });
  if (insertError) {
    return NextResponse.json({ error: "Could not initialize the payment ledger entry." }, { status: 500 });
  }

  const form = new URLSearchParams();
  form.set("mode", "payment");
  const holdExpiresAt = b.status === "hold" ? Math.floor(Date.now() / 1000) + 35 * 60 : null;
  if (holdExpiresAt) form.set("expires_at", String(holdExpiresAt));
  form.set("success_url", successUrl);
  form.set("cancel_url", cancelUrl);
  form.set("customer_email", b.guest_email);
  form.set("client_reference_id", b.id);
  form.set("metadata[booking_id]", b.id);
  form.set("metadata[transaction_id]", transactionId);
  form.set("metadata[booking_code]", b.code || b.id);
  form.set("payment_intent_data[metadata][booking_id]", b.id);
  form.set("payment_intent_data[metadata][transaction_id]", transactionId);
  form.set("line_items[0][quantity]", "1");
  form.set("line_items[0][price_data][currency]", currency);
  form.set("line_items[0][price_data][unit_amount]", String(amountMinor));
  form.set("line_items[0][price_data][product_data][name]", "Villa Memaj — booking " + (b.code || b.id));
  form.set("line_items[0][price_data][product_data][description]", "Stay " + b.check_in + " to " + b.check_out + ". Payment for booking " + (b.code || b.id) + ".");

  let stripeResponse: Response;
  try {
    stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + secret,
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": idempotencyKey,
      },
      body: form,
      cache: "no-store",
    });
  } catch {
    await supabase.from("hotel_payment_transactions").update({ status: "failed", failure_code: "stripe_unreachable" }).eq("id", transactionId);
    return NextResponse.json({ error: "Stripe could not be reached. Please retry." }, { status: 502 });
  }

  const session = await stripeResponse.json().catch(() => null) as { id?: string; url?: string; error?: { message?: string } } | null;
  if (!stripeResponse.ok || !session?.id || !session.url) {
    await supabase.from("hotel_payment_transactions").update({
      status: "failed",
      failure_code: "checkout_session_creation_failed",
      notes: (session?.error?.message || "Stripe Checkout session creation failed").slice(0, 500),
    }).eq("id", transactionId);
    return NextResponse.json({ error: "Stripe could not create the checkout session. Check the Stripe configuration and booking currency." }, { status: 502 });
  }

  if (holdExpiresAt) {
    const { data: hold, error: holdError } = await supabase
      .from("hotel_bookings")
      .update({ expires_at: new Date(holdExpiresAt * 1000).toISOString() })
      .eq("id", b.id)
      .eq("status", "hold")
      .select("id")
      .maybeSingle();
    if (holdError || !hold) {
      await fetch("https://api.stripe.com/v1/checkout/sessions/" + encodeURIComponent(session.id) + "/expire", {
        method: "POST",
        headers: { Authorization: "Bearer " + secret, "Content-Type": "application/x-www-form-urlencoded" },
        body: "",
        cache: "no-store",
      }).catch(() => undefined);
      await supabase.from("hotel_payment_transactions").update({ status: "failed", failure_code: "booking_hold_expired" }).eq("id", transactionId);
      return NextResponse.json({ error: "The booking hold expired while creating checkout. No payment link was issued." }, { status: 409 });
    }
  }

  const { error: updateError } = await supabase.from("hotel_payment_transactions").update({
    status: "pending",
    provider_transaction_id: session.id,
    notes: "Stripe Checkout session created.",
  }).eq("id", transactionId);
  if (updateError) {
    return NextResponse.json({ error: "Checkout was created but its ledger update failed. Do not create another payment; contact the administrator." }, { status: 500 });
  }

  return NextResponse.json({ checkoutUrl: session.url, transactionId, amount: amount.toFixed(2), currency: b.currency_code });
}
