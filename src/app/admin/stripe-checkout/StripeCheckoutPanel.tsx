"use client";

import { useState } from "react";
import type { StaffRole } from "@/lib/admin/auth";

export type PayableBooking = {
  id: string;
  code: string | null;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  status: string;
  payment_status: string;
  payment_mode: string;
  payment_due: number | string | null;
  deposit_amount: number | string | null;
  balance_due: number | string | null;
  currency_code: string;
};

function formatMoney(value: unknown, currency: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
  } catch {
    return amount.toFixed(2) + " " + currency;
  }
}

export default function StripeCheckoutPanel({
  bookings,
  role,
}: {
  bookings: PayableBooking[];
  role: StaffRole;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [checkoutLinks, setCheckoutLinks] = useState<Record<string, string>>({});

  async function createCheckout(booking: PayableBooking) {
    setBusyId(booking.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const result = await response.json().catch(() => null) as { checkoutUrl?: string; error?: string } | null;
      if (!response.ok || !result?.checkoutUrl) {
        setError(result?.error || "Could not create a Stripe checkout session.");
        return;
      }
      setCheckoutLinks((current) => ({ ...current, [booking.id]: result.checkoutUrl! }));
      setNotice("Secure payment link created. Copy it and send it to the guest; the booking will update only after Stripe verifies payment.");
    } catch {
      setError("Network error while creating checkout. Please retry.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="font-semibold text-slate-900">Bookings awaiting online payment</h2>
          <p className="mt-1 text-sm text-slate-500">Signed in as {role}. Only confirmed bookings and active holds are listed.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{bookings.length} booking{bookings.length === 1 ? "" : "s"}</span>
      </div>

      {error ? <div role="alert" className="mx-5 mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div> : null}
      {notice ? <div role="status" className="mx-5 mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div> : null}

      {bookings.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="font-medium text-slate-800">No online-payable bookings</p>
          <p className="mt-2 text-sm text-slate-500">A booking must be configured for online payment and have an outstanding balance before a Checkout link can be created.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {bookings.map((booking) => {
            const due = Number(booking.payment_due) > 0 ? booking.payment_due : booking.balance_due;
            return (
              <article key={booking.id} className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{booking.code || booking.id}</p>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{booking.status.replaceAll("_", " ")}</span>
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-800">{booking.payment_status.replaceAll("_", " ")}</span>
                  </div>
                  <p className="mt-1 truncate text-sm font-medium text-slate-800">{booking.guest_name}</p>
                  <p className="text-sm text-slate-500">{booking.guest_email}</p>
                  <p className="mt-2 text-sm text-slate-600">{booking.check_in} → {booking.check_out}</p>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
                  <p className="text-xl font-semibold tabular-nums text-slate-950">{formatMoney(due, booking.currency_code)}</p>
                  <button
                    type="button"
                    onClick={() => createCheckout(booking)}
                    disabled={busyId !== null}
                    className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busyId === booking.id ? "Creating secure link…" : checkoutLinks[booking.id] ? "Create a new link" : "Create payment link"}
                  </button>
                  {checkoutLinks[booking.id] ? (
                    <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                      <a href={checkoutLinks[booking.id]} target="_blank" rel="noreferrer" className="text-sm font-semibold text-emerald-800 underline underline-offset-4">Preview checkout</a>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(checkoutLinks[booking.id]);
                            setNotice("Payment link copied. Send it to " + booking.guest_name + ".");
                          } catch {
                            setError("Copy was blocked by this browser. Use the Preview checkout link and copy its URL from the address bar.");
                          }
                        }}
                        className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >Copy payment link</button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
      <p className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs leading-5 text-slate-500">Card details are collected on Stripe-hosted Checkout. A browser redirect alone never marks a booking as paid; only verified webhooks update the ledger.</p>
    </section>
  );
}
