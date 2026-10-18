import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, Kpi, StatusBadge, PaymentBadge, EmptyState } from "@/components/admin/ui";
import { formatDate, formatMoney, SOURCE_LABELS } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireStaff();
  const supabase = await createSupabaseServerClient();

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 7)}-01`;
  const in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);

  const [{ data: bookings }, { data: rooms }, { data: payments }] = await Promise.all([
    supabase
      .from("hotel_bookings")
      .select(
        "id, code, guest_name, guest_email, guest_phone, room_id, check_in, check_out, nights, adults, children, guests, status, payment_status, total_price, amount_paid, balance_due, currency_code, source, created_at, expires_at"
      )
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("hotel_rooms").select("id, name_en, name_el, capacity").order("sort_order"),
    supabase
      .from("hotel_payment_transactions")
      .select("kind, status, amount, currency_code, created_at")
      .gte("created_at", `${monthStart}T00:00:00`)
      .limit(1000),
  ]);

  const roomName = new Map((rooms ?? []).map((r) => [r.id, r.name_en]));
  const all = bookings ?? [];
  const live = (s: string) => s === "confirmed" || s === "checked_in";

  const arrivalsToday = all.filter((b) => b.check_in === today && live(b.status));
  const departuresToday = all.filter((b) => b.check_out === today && b.status === "checked_in");
  const inHouse = all.filter((b) => b.status === "checked_in");
  const requests = all.filter((b) => b.status === "request");
  const holds = all.filter(
    (b) => b.status === "hold" && b.expires_at && new Date(b.expires_at) > new Date()
  );
  const upcoming = all
    .filter((b) => b.check_in > today && b.check_in <= in7 && live(b.status))
    .sort((a, b) => a.check_in.localeCompare(b.check_in));

  const outstanding = all
    .filter((b) => live(b.status))
    .reduce((sum, b) => sum + Number(b.balance_due ?? 0), 0);

  const chargesMtd = (payments ?? []).filter(
    (p) => p.kind === "charge" && p.status === "succeeded" && p.currency_code === "EUR"
  );
  const revenueMtd = chargesMtd.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Arrivals today" value={arrivalsToday.length} tone="good" />
        <Kpi label="Departures today" value={departuresToday.length} tone="info" />
        <Kpi label="In house" value={inHouse.length} />
        <Kpi
          label="New requests"
          value={requests.length}
          tone={requests.length ? "warn" : "default"}
          hint="Awaiting confirmation"
        />
        <Kpi
          label="Active holds"
          value={holds.length}
          tone={holds.length ? "warn" : "default"}
          hint="Auto-expire in 30 min"
        />
        <Kpi label="Arrivals next 7 days" value={upcoming.length} />
        <Kpi label="Revenue (MTD, EUR)" value={formatMoney(revenueMtd, "EUR")} tone="good" />
        <Kpi
          label="Outstanding balance"
          value={formatMoney(outstanding, "EUR")}
          tone={outstanding > 0 ? "warn" : "default"}
          hint="Confirmed & in-house stays"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card
          title="Arrivals today"
          action={<Link href="/admin/reservations?status=confirmed" className="text-xs font-medium text-slate-500 hover:text-slate-900">View all</Link>}
        >
          {arrivalsToday.length === 0 ? (
            <EmptyState>No arrivals scheduled today.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {arrivalsToday.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <Link href={`/admin/reservations/${b.id}`} className="truncate text-sm font-medium text-slate-900 hover:underline">
                      {b.guest_name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {roomName.get(b.room_id) ?? "—"} · {b.nights} night(s) · {b.guests} guest(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PaymentBadge status={b.payment_status} />
                    <StatusBadge status={b.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="New requests"
          action={<Link href="/admin/reservations?status=request" className="text-xs font-medium text-slate-500 hover:text-slate-900">View all</Link>}
        >
          {requests.length === 0 ? (
            <EmptyState>No pending requests.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {requests.slice(0, 8).map((b) => (
                <li key={b.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <Link href={`/admin/reservations/${b.id}`} className="truncate text-sm font-medium text-slate-900 hover:underline">
                      {b.guest_name} <span className="text-slate-400">{b.code}</span>
                    </Link>
                    <p className="text-xs text-slate-500">
                      {formatDate(b.check_in)} → {formatDate(b.check_out)} ·{" "}
                      {roomName.get(b.room_id) ?? "—"} · {SOURCE_LABELS[b.source] ?? b.source}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-slate-900">
                    {formatMoney(b.total_price, b.currency_code)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Upcoming arrivals (7 days)">
          {upcoming.length === 0 ? (
            <EmptyState>Nothing in the next 7 days.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcoming.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <Link href={`/admin/reservations/${b.id}`} className="truncate text-sm font-medium text-slate-900 hover:underline">
                      {b.guest_name}
                    </Link>
                    <p className="text-xs text-slate-500">{roomName.get(b.room_id) ?? "—"}</p>
                  </div>
                  <span className="text-xs font-medium text-slate-600">{formatDate(b.check_in)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Active holds">
          {holds.length === 0 ? (
            <EmptyState>No held bookings awaiting payment.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {holds.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <Link href={`/admin/reservations/${b.id}`} className="truncate text-sm font-medium text-slate-900 hover:underline">
                      {b.guest_name} <span className="text-slate-400">{b.code}</span>
                    </Link>
                    <p className="text-xs text-slate-500">
                      Expires {new Date(b.expires_at as string).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-slate-900">
                    {formatMoney(b.balance_due ?? b.total_price, b.currency_code)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
