import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  Card,
  Field,
  StatusBadge,
  PaymentBadge,
  EmptyState,
  inputClass,
  labelClass,
  buttonClass,
  buttonSecondaryClass,
} from "@/components/admin/ui";
import { formatDate, formatDateTime, formatMoney, SOURCE_LABELS } from "@/lib/admin/format";
import {
  confirmBooking,
  checkInBooking,
  checkOutBooking,
  cancelBooking,
  markNoShow,
  recordPayment,
  markRefundProcessed,
  updateInternalNotes,
} from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

interface PolicySnapshot {
  rate_plan?: Record<string, unknown>;
  cancellation_policy?: Record<string, unknown>;
  price?: Record<string, unknown>;
  tax?: Record<string, unknown>;
  accepted_terms_at?: string;
}

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { role } = await requireStaff();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: booking } = await supabase
    .from("hotel_bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!booking) notFound();

  const [{ data: room }, { data: payments }] = await Promise.all([
    supabase.from("hotel_rooms").select("id, name_el, name_en, capacity").eq("id", booking.room_id).maybeSingle(),
    supabase
      .from("hotel_payment_transactions")
      .select("id, kind, provider, method, status, amount, currency_code, notes, processed_at, created_at")
      .eq("booking_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const canManageBookings = ["owner", "manager", "receptionist"].includes(role);
  const canManageMoney = ["owner", "manager", "receptionist", "accountant"].includes(role);
  const canProcessRefund = ["owner", "manager", "accountant"].includes(role);

  const snapshot = (booking.cancellation_policy_snapshot ?? {}) as PolicySnapshot;
  const ledger = payments ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/reservations" className="text-xs font-medium text-slate-500 hover:text-slate-900">
            ← Reservations
          </Link>
          <h1 className="mt-1 flex items-center gap-3 text-xl font-semibold text-slate-900">
            {booking.code}
            <StatusBadge status={booking.status} />
          </h1>
          <p className="text-sm text-slate-500">
            Created {formatDateTime(booking.created_at)} · {SOURCE_LABELS[booking.source] ?? booking.source}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManageBookings && ["request", "hold"].includes(booking.status) && (
            <form action={confirmBooking}>
              <input type="hidden" name="booking_id" value={booking.id} />
              <button className={buttonClass}>Confirm booking</button>
            </form>
          )}
          {canManageBookings && booking.status === "confirmed" && (
            <form action={checkInBooking}>
              <input type="hidden" name="booking_id" value={booking.id} />
              <button className={buttonClass}>Check in</button>
            </form>
          )}
          {canManageBookings && booking.status === "checked_in" && (
            <form action={checkOutBooking}>
              <input type="hidden" name="booking_id" value={booking.id} />
              <button className={buttonClass}>Check out</button>
            </form>
          )}
          {canManageBookings && ["confirmed", "checked_in"].includes(booking.status) && (
            <form action={markNoShow}>
              <input type="hidden" name="booking_id" value={booking.id} />
              <button className={buttonSecondaryClass}>Mark no-show</button>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Guest">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" value={booking.guest_name} />
              <Field
                label="Email"
                value={
                  <a href={`mailto:${booking.guest_email}`} className="text-sky-700 hover:underline">
                    {booking.guest_email}
                  </a>
                }
              />
              <Field
                label="Phone"
                value={
                  booking.guest_phone ? (
                    <a href={`tel:${booking.guest_phone}`} className="text-sky-700 hover:underline">
                      {booking.guest_phone}
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
              <Field label="Guests" value={`${booking.adults} adult(s), ${booking.children} child(ren)`} />
            </dl>
          </Card>

          <Card title="Stay">
            <dl className="grid gap-4 sm:grid-cols-3">
              <Field label="Room" value={room?.name_en ?? "—"} />
              <Field label="Check-in" value={formatDate(booking.check_in)} />
              <Field label="Check-out" value={formatDate(booking.check_out)} />
              <Field label="Nights" value={booking.nights} />
              <Field label="Status" value={<StatusBadge status={booking.status} />} />
              <Field label="Hold expires" value={booking.expires_at ? formatDateTime(booking.expires_at) : "—"} />
            </dl>
            {booking.special_requests && (
              <div className="mt-4 rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Special requests</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{booking.special_requests}</p>
              </div>
            )}
          </Card>

          <Card title="Rate, policy & terms (snapshot)">
            {!snapshot.rate_plan ? (
              <EmptyState>No snapshot recorded (legacy booking).</EmptyState>
            ) : (
              <div className="space-y-4 text-sm">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Field label="Rate plan" value={String(snapshot.rate_plan.name_en ?? "—")} />
                  <Field label="Refundable" value={snapshot.rate_plan.refundable ? "Yes" : "No"} />
                  <Field
                    label="Deposit"
                    value={`${snapshot.rate_plan.deposit_percent ?? 0}% · ${formatMoney(
                      Number(snapshot.rate_plan.deposit_amount ?? 0),
                      booking.currency_code
                    )}`}
                  />
                  <Field label="Balance due" value={String(snapshot.rate_plan.balance_due ?? "—")} />
                </dl>
                {snapshot.cancellation_policy && Object.keys(snapshot.cancellation_policy).length > 0 && (
                  <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                    <p className="font-medium text-slate-700">
                      Cancellation: {String(snapshot.cancellation_policy.name ?? "")} v
                      {String(snapshot.cancellation_policy.version ?? 1)}
                    </p>
                    <p className="mt-1">
                      Free cancellation until {String(snapshot.cancellation_policy.free_cancel_before_hours ?? 0)}h before
                      check-in · late penalty: {String(snapshot.cancellation_policy.late_cancel_penalty_type ?? "—")}
                      {snapshot.cancellation_policy.non_refundable ? " · non-refundable" : ""}
                    </p>
                  </div>
                )}
                <p className="text-xs text-slate-400">
                  Terms accepted: {snapshot.accepted_terms_at ? formatDateTime(snapshot.accepted_terms_at) : "—"} ·
                  version {booking.accepted_terms_version ?? "—"}
                </p>
              </div>
            )}
          </Card>

          <Card title="Internal notes">
            <form action={updateInternalNotes} className="space-y-3">
              <input type="hidden" name="booking_id" value={booking.id} />
              <textarea
                name="internal_notes"
                defaultValue={booking.internal_notes ?? ""}
                rows={3}
                className={inputClass}
                placeholder="Notes visible to staff only…"
              />
              <button className={buttonSecondaryClass}>Save notes</button>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Payment">
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Status</dt>
                <dd><PaymentBadge status={booking.payment_status} /></dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Total</dt>
                <dd className="font-medium">{formatMoney(booking.total_price, booking.currency_code)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Paid</dt>
                <dd className="font-medium text-emerald-700">
                  {formatMoney(booking.amount_paid, booking.currency_code)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Balance</dt>
                <dd className="font-medium text-amber-700">
                  {formatMoney(booking.balance_due, booking.currency_code)}
                </dd>
              </div>
              {Number(booking.cancellation_fee_charged) > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">Cancellation fee</dt>
                  <dd className="font-medium text-rose-700">
                    {formatMoney(booking.cancellation_fee_charged, booking.currency_code)}
                  </dd>
                </div>
              )}
            </dl>

            {canManageMoney && ["request", "hold", "confirmed", "checked_in"].includes(booking.status) && (
              <form action={recordPayment} className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                <input type="hidden" name="booking_id" value={booking.id} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Type</label>
                    <select name="kind" className={inputClass} defaultValue="charge">
                      <option value="charge">Charge</option>
                      <option value="refund">Refund</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Amount ({booking.currency_code})</label>
                    <input
                      name="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={Number(booking.balance_due ?? 0) || ""}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Method</label>
                    <select name="method" className={inputClass} defaultValue="cash">
                      <option value="cash">Cash</option>
                      <option value="card">Card (POS)</option>
                      <option value="bank_transfer">Bank transfer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Provider</label>
                    <select name="provider" className={inputClass} defaultValue="manual">
                      <option value="manual">Manual</option>
                      <option value="bkt_vpos">BKT Virtual POS</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <input name="notes" placeholder="Reference / note" className={inputClass} />
                <button className={buttonClass}>Record payment</button>
              </form>
            )}
          </Card>

          <Card title="Ledger">
            {ledger.length === 0 ? (
              <EmptyState>No transactions yet.</EmptyState>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {ledger.map((p) => (
                  <li key={p.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900 capitalize">{p.kind}</span>
                      <span className={p.kind === "refund" ? "text-rose-700" : "text-emerald-700"}>
                        {p.kind === "refund" ? "−" : "+"}
                        {formatMoney(p.amount, p.currency_code)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {p.method} · {p.provider} · {p.status} · {formatDateTime(p.created_at)}
                    </p>
                    {p.notes && <p className="text-xs text-slate-400">{p.notes}</p>}
                    {canProcessRefund && p.kind === "refund" && p.status === "refund_pending" && (
                      <form action={markRefundProcessed} className="mt-2">
                        <input type="hidden" name="payment_id" value={p.id} />
                        <button className="text-xs font-semibold text-sky-700 hover:underline">
                          Mark refund as processed
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {canManageBookings && !["cancelled", "checked_out"].includes(booking.status) && (
            <Card title="Cancel booking">
              <form action={cancelBooking} className="space-y-3">
                <input type="hidden" name="booking_id" value={booking.id} />
                <textarea
                  name="reason"
                  rows={2}
                  required
                  placeholder="Reason (recorded on the booking)…"
                  className={inputClass}
                />
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" name="waive_fee" className="h-4 w-4" />
                  Waive cancellation fee
                </label>
                <button className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500">
                  Cancel booking
                </button>
                <p className="text-xs text-slate-400">
                  Fee is calculated from the booking&apos;s policy snapshot. Any amount paid above the fee becomes a
                  refund to process.
                </p>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
