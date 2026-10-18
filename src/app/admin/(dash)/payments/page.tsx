import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, Kpi, EmptyState } from "@/components/admin/ui";
import { formatDateTime, formatMoney } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  succeeded: "text-emerald-700",
  refunded: "text-sky-700",
  refund_pending: "text-rose-700",
  pending: "text-amber-700",
  initiated: "text-slate-600",
  failed: "text-red-700",
  cancelled: "text-slate-400",
};

export default async function PaymentsPage() {
  await requireStaff(["owner", "manager", "receptionist", "accountant"]);
  const supabase = await createSupabaseServerClient();

  const { data: payments } = await supabase
    .from("hotel_payment_transactions")
    .select(
      "id, booking_id, kind, provider, method, status, amount, currency_code, notes, processed_at, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: bookings } = await supabase
    .from("hotel_bookings")
    .select("id, code, guest_name")
    .limit(500);
  const bookingMap = new Map((bookings ?? []).map((b) => [b.id, b]));

  const rows = payments ?? [];
  const sum = (kind: string, status: string) =>
    rows
      .filter((p) => p.kind === kind && p.status === status && p.currency_code === "EUR")
      .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Payments</h1>
        <p className="text-sm text-slate-500">
          Ledger of all charges and refunds. Online gateway (BKT Virtual POS) is adapter-ready; manual records appear
          here immediately.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Charges collected (EUR)" value={formatMoney(sum("charge", "succeeded"), "EUR")} tone="good" />
        <Kpi label="Refunds done (EUR)" value={formatMoney(sum("refund", "refunded"), "EUR")} tone="info" />
        <Kpi label="Refunds pending" value={formatMoney(sum("refund", "refund_pending"), "EUR")} tone="warn" />
        <Kpi label="Transactions" value={rows.length} />
      </div>

      <Card title="Transactions">
        {rows.length === 0 ? (
          <EmptyState>No payments recorded yet.</EmptyState>
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-2 font-medium">When</th>
                  <th className="px-5 py-2 font-medium">Booking</th>
                  <th className="px-5 py-2 font-medium">Type</th>
                  <th className="px-5 py-2 font-medium">Method</th>
                  <th className="px-5 py-2 font-medium">Provider</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((p) => {
                  const booking = bookingMap.get(p.booking_id);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 text-slate-500">{formatDateTime(p.created_at)}</td>
                      <td className="px-5 py-3">
                        <Link href={`/admin/reservations/${p.booking_id}`} className="font-medium text-slate-900 hover:underline">
                          {booking?.code ?? p.booking_id.slice(0, 8)}
                        </Link>
                        <p className="text-xs text-slate-500">{booking?.guest_name ?? "—"}</p>
                      </td>
                      <td className="px-5 py-3 capitalize text-slate-600">{p.kind}</td>
                      <td className="px-5 py-3 text-slate-600">{p.method}</td>
                      <td className="px-5 py-3 text-slate-600">{p.provider}</td>
                      <td className={`px-5 py-3 font-medium ${STATUS_TONE[p.status] ?? "text-slate-600"}`}>
                        {p.status}
                      </td>
                      <td className="px-5 py-3 text-right font-medium">
                        {p.kind === "refund" ? "−" : ""}
                        {formatMoney(p.amount, p.currency_code)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
