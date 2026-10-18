import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

const modules = [
  { category: "Rates & availability", name: "Calendar", description: "Review arrivals, departures, room availability and blocked dates.", href: "/admin/calendar", mark: "▦" },
  { category: "Rates & availability", name: "Rates & promotions", description: "Manage rate plans, seasonal rates and discounts.", href: "/admin/rate-plans", mark: "€" },
  { category: "Reservations", name: "Reservations", description: "Review booking requests, confirmed stays and guest records.", href: "/admin/reservations", mark: "▤" },
  { category: "Property", name: "Rooms & facilities", description: "Update room information, capacity and amenities.", href: "/admin/rooms", mark: "⌂" },
  { category: "Property", name: "Property policies", description: "Centralise check-in, children, house rules, parking and guest information.", href: "/admin/extranet/property-policies", mark: "✓" },
  { category: "Guest experience", name: "Guest reviews", description: "Review the authorized Booking.com API integration status and reply workflow.", href: "/admin/reviews", mark: "☆" },
  { category: "Guest experience", name: "Inbox & notifications", description: "Check queued guest communications and delivery status.", href: "/admin/notifications", mark: "✉" },
  { category: "Finance", name: "Payments & ledger", description: "Review recorded payments, balances and transaction history.", href: "/admin/payments", mark: "↗" },
  { category: "Performance", name: "Analytics", description: "Monitor reservation mix, payments and basic occupancy indicators.", href: "/admin/extranet/analytics", mark: "▥" },
  { category: "More", name: "Guest profiles", description: "View guest records and repeat-guest context.", href: "/admin/guests", mark: "♙" },
  { category: "More", name: "Staff & access", description: "Manage staff roles and authorised access.", href: "/admin/staff", mark: "♧" },
  { category: "More", name: "Audit log", description: "Review recorded changes to bookings, rates, rooms and payments.", href: "/admin/audit", mark: "◷" },
];

function currency(value: number, unit: string) {
  try { return new Intl.NumberFormat("en-GB", { style: "currency", currency: unit }).format(value); }
  catch { return value.toFixed(2) + " " + unit; }
}

export default async function ExtranetHomePage() {
  const { supabase, role, user } = await requireStaff();
  const { data: rows, error } = await supabase
    .from("hotel_bookings")
    .select("id,status,payment_status,total_price,amount_paid,currency_code,check_in,check_out")
    .order("created_at", { ascending: false })
    .limit(500);
  const bookings = rows ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const waiting = bookings.filter((b: any) => ["request", "hold"].includes(b.status)).length;
  const arrivals = bookings.filter((b: any) => b.status === "confirmed" && b.check_in >= today && b.check_in <= nextWeek).length;
  const stayCount = bookings.filter((b: any) => ["confirmed", "checked_in"].includes(b.status)).length;
  const canSeeFinance = ["owner", "manager", "accountant"].includes(role);
  const paidEUR = bookings.filter((b: any) => b.currency_code === "EUR").reduce((total: number, b: any) => total + Number(b.amount_paid || 0), 0);
  const paidALL = bookings.filter((b: any) => b.currency_code === "ALL").reduce((total: number, b: any) => total + Number(b.amount_paid || 0), 0);
  const byCategory = ["Rates & availability", "Reservations", "Property", "Guest experience", "Finance", "Performance", "More"];

  return (
    <div className="admin-extranet-page">
      <div className="admin-extranet-page-header">
        <div>
          <p className="admin-eyebrow">Villa Memaj · Property Extranet</p>
          <h1>Good to see you.</h1>
          <p className="admin-page-intro">One workspace for rates, reservations, guest experience and property operations.</p>
        </div>
        <div className="admin-user-chip"><span className="admin-user-avatar">{role.slice(0,1).toUpperCase()}</span><span><strong>{role.replaceAll("_", " ")}</strong><small>{user.email}</small></span></div>
      </div>

      {error ? <div role="alert" className="admin-portal-alert warning">Booking summaries could not be loaded. Check your role membership and database policies.</div> : null}

      <section className="admin-extranet-metrics" aria-label="Property overview">
        <article><span>Open booking requests</span><strong>{waiting}</strong><small>Requests or temporary holds</small></article>
        <article><span>Arrivals · next 7 days</span><strong>{arrivals}</strong><small>Confirmed arrivals</small></article>
        <article><span>Active stays / confirmed</span><strong>{stayCount}</strong><small>Current booking pipeline</small></article>
        {canSeeFinance ? <article><span>Recorded payments</span><strong>{currency(paidEUR, "EUR")}</strong><small>{currency(paidALL, "ALL")} in ALL</small></article> : null}
      </section>

      <section className="admin-module-section">
        <div className="admin-section-heading"><div><p className="admin-eyebrow">Your property</p><h2>Manage your day</h2></div><span>{bookings.length} recent booking records loaded</span></div>
        {modules.filter((item) => canSeeFinance || item.category !== "Finance").reduce((acc: {category:string;items:typeof modules}[], item) => {
          const existing = acc.find((group) => group.category === item.category);
          if (existing) existing.items.push(item); else acc.push({ category: item.category, items: [item] });
          return acc;
        }, []).map((group) => (
          <div key={group.category} className="admin-module-group">
            <h3>{group.category}</h3>
            <div className="admin-module-grid">
              {group.items.map((item) => (
                <Link key={item.href} href={item.href} className="admin-module-card">
                  <span className="admin-module-mark" aria-hidden="true">{item.mark}</span>
                  <span className="admin-module-title">{item.name}<span aria-hidden="true">↗</span></span>
                  <span className="admin-module-description">{item.description}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
      <p className="admin-data-note">This overview reports data already recorded in the CRM. It is not a substitute for reconciliation against the booking channel, payment provider, bank or accounting records.</p>
    </div>
  );
}
