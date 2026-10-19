import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

type BookingAnalytics = {
  status: string;
  payment_status: string;
  total_price: number | string | null;
  amount_paid: number | string | null;
  currency_code: string;
  check_in: string;
  check_out: string;
  created_at: string;
};
type PaymentAnalytics = {
  status: string;
  kind: string;
  amount: number | string | null;
  currency_code: string;
};

function money(value: number, currency: string) {
  try { return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(value); }
  catch { return value.toFixed(2) + " " + currency; }
}

export default async function ExtranetAnalyticsPage() {
  const { supabase } = await requireStaff(["owner", "manager", "accountant"]);
  const [bookingResult, roomsResult, paymentsResult] = await Promise.all([
    supabase.from("hotel_bookings").select("status,payment_status,total_price,amount_paid,currency_code,check_in,check_out,created_at").order("created_at", { ascending: false }).limit(1000),
    supabase.from("hotel_rooms").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("hotel_payment_transactions").select("status,kind,amount,currency_code").eq("status", "succeeded").eq("kind", "charge").limit(1000),
  ]);
  const bookings = (bookingResult.data ?? []) as BookingAnalytics[];
  const payments = (paymentsResult.data ?? []) as PaymentAnalytics[];
  const confirmed = bookings.filter((booking) => ["confirmed", "checked_in", "checked_out"].includes(booking.status));
  const pending = bookings.filter((booking) => ["request", "hold"].includes(booking.status));
  const paidEUR = bookings.filter((booking) => booking.currency_code === "EUR").reduce((sum, booking) => sum + Number(booking.amount_paid || 0), 0);
  const paidALL = bookings.filter((booking) => booking.currency_code === "ALL").reduce((sum, booking) => sum + Number(booking.amount_paid || 0), 0);
  const paidTransactionsEUR = payments.filter((payment) => payment.currency_code === "EUR").reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const paidTransactionsALL = payments.filter((payment) => payment.currency_code === "ALL").reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const statusItems = [
    { label: "Requests", value: bookings.filter((booking) => booking.status === "request").length },
    { label: "Payment holds", value: bookings.filter((booking) => booking.status === "hold").length },
    { label: "Confirmed", value: bookings.filter((booking) => booking.status === "confirmed").length },
    { label: "Checked in", value: bookings.filter((booking) => booking.status === "checked_in").length },
    { label: "Checked out", value: bookings.filter((booking) => booking.status === "checked_out").length },
    { label: "Cancelled / no-show", value: bookings.filter((booking) => ["cancelled", "no_show"].includes(booking.status)).length },
  ];
  const errors = [bookingResult.error, roomsResult.error, paymentsResult.error].filter(Boolean);
  return (
    <div className="admin-extranet-page">
      <div className="admin-extranet-page-header">
        <div><p className="admin-eyebrow">Performance</p><h1>Analytics</h1><p className="admin-page-intro">Operational totals from the records currently visible to your staff role.</p></div>
        <Link href="/admin/extranet" className="admin-back-link">← Extranet home</Link>
      </div>
      {errors.length ? <div role="alert" className="admin-portal-alert warning">Some figures may be incomplete because one or more CRM tables could not be read.</div> : null}
      <section className="admin-extranet-metrics">
        <article><span>Booking records (last 1,000)</span><strong>{bookings.length}</strong><small>Not a lifetime total when the table exceeds the query limit</small></article>
        <article><span>Confirmed or completed stays</span><strong>{confirmed.length}</strong><small>Includes confirmed, checked-in and checked-out</small></article>
        <article><span>Open requests / holds</span><strong>{pending.length}</strong><small>Not yet completed bookings</small></article>
        <article><span>Active rooms</span><strong>{roomsResult.count ?? "—"}</strong><small>Rooms marked active in the property catalogue</small></article>
      </section>
      <div className="admin-analytics-grid">
        <section className="admin-panel">
          <div className="admin-section-heading"><div><p className="admin-eyebrow">Reservation pipeline</p><h2>Booking status</h2></div></div>
          <div className="admin-status-list">{statusItems.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
        </section>
        <section className="admin-panel">
          <div className="admin-section-heading"><div><p className="admin-eyebrow">Finance snapshot</p><h2>Recorded payments</h2></div></div>
          <div className="admin-finance-row"><span>Booking ledger · EUR</span><strong>{money(paidEUR, "EUR")}</strong></div>
          <div className="admin-finance-row"><span>Booking ledger · ALL</span><strong>{money(paidALL, "ALL")}</strong></div>
          <div className="admin-finance-row"><span>Succeeded charge transactions · EUR</span><strong>{money(paidTransactionsEUR, "EUR")}</strong></div>
          <div className="admin-finance-row"><span>Succeeded charge transactions · ALL</span><strong>{money(paidTransactionsALL, "ALL")}</strong></div>
          <p className="admin-data-note">Amounts are reported separately by currency. Reconcile them with the payment provider and bank statements before using them for accounting or tax reporting.</p>
        </section>
      </div>
    </div>
  );
}
