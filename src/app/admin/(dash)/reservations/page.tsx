import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, StatusBadge, PaymentBadge, EmptyState, inputClass } from "@/components/admin/ui";
import { formatDate, formatMoney, STATUS_LABELS, BOOKING_STATUSES } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

const FILTERS = ["all", ...BOOKING_STATUSES] as const;

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireStaff();
  const { status = "all", q = "" } = await searchParams;
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("hotel_bookings")
    .select(
      "id, code, guest_name, guest_email, guest_phone, room_id, check_in, check_out, nights, guests, status, payment_status, total_price, amount_paid, balance_due, currency_code, source, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(300);

  if (status !== "all" && (BOOKING_STATUSES as readonly string[]).includes(status)) {
    query = query.eq("status", status);
  }
  const term = q.trim();
  if (term) {
    query = query.or(
      `guest_name.ilike.%${term}%,guest_email.ilike.%${term}%,code.ilike.%${term}%`
    );
  }

  const [{ data: bookings }, { data: rooms }] = await Promise.all([
    query,
    supabase.from("hotel_rooms").select("id, name_en"),
  ]);
  const roomName = new Map((rooms ?? []).map((r) => [r.id, r.name_en]));
  const rows = bookings ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Reservations</h1>
          <p className="text-sm text-slate-500">{rows.length} booking(s)</p>
        </div>
        <form className="flex gap-2" action="/admin/reservations">
          <input type="hidden" name="status" value={status} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, email or code…"
            className={`${inputClass} w-64`}
          />
          <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
            Search
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={`/admin/reservations?status=${f}${term ? `&q=${encodeURIComponent(term)}` : ""}`}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${
              status === f
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
            }`}
          >
            {f === "all" ? "All" : STATUS_LABELS[f]}
          </Link>
        ))}
      </div>

      <Card>
        {rows.length === 0 ? (
          <EmptyState>No reservations match this filter.</EmptyState>
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-2 font-medium">Code</th>
                  <th className="px-5 py-2 font-medium">Guest</th>
                  <th className="px-5 py-2 font-medium">Room</th>
                  <th className="px-5 py-2 font-medium">Stay</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium">Payment</th>
                  <th className="px-5 py-2 text-right font-medium">Total</th>
                  <th className="px-5 py-2 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link href={`/admin/reservations/${b.id}`} className="font-medium text-slate-900 hover:underline">
                        {b.code}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/reservations/${b.id}`} className="text-slate-900 hover:underline">
                        {b.guest_name}
                      </Link>
                      <p className="text-xs text-slate-500">{b.guest_email}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{roomName.get(b.room_id) ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {formatDate(b.check_in)} → {formatDate(b.check_out)}
                      <p className="text-xs text-slate-400">{b.nights} night(s) · {b.guests} guest(s)</p>
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-5 py-3"><PaymentBadge status={b.payment_status} /></td>
                    <td className="px-5 py-3 text-right font-medium text-slate-900">
                      {formatMoney(b.total_price, b.currency_code)}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600">
                      {formatMoney(b.balance_due, b.currency_code)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
