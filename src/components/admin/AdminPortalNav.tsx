"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

const items = [
  { group: "Workspace", label: "Home", href: "/admin/extranet", keywords: "dashboard overview" },
  { group: "Rates & availability", label: "Calendar", href: "/admin/calendar", keywords: "availability inventory bookings" },
  { group: "Rates & availability", label: "Rates and promotions", href: "/admin/rate-plans", keywords: "rates pricing promotions discounts" },
  { group: "Reservations", label: "Reservations", href: "/admin/reservations", keywords: "bookings requests confirmed guests" },
  { group: "Property", label: "Rooms and amenities", href: "/admin/rooms", keywords: "property content photos amenities" },
  { group: "Property", label: "Property policies", href: "/admin/extranet/property-policies", keywords: "children check-in checkout smoking pets parking wifi" },
  { group: "Guest experience", label: "Support inbox", href: "/admin/support", keywords: "chat guest support ai team replies" },
  { group: "Guest experience", label: "Inbox and notifications", href: "/admin/notifications", keywords: "email guest messages inbox" },
  { group: "Guest experience", label: "Guest reviews", href: "/admin/reviews", keywords: "booking.com ratings review replies integration" },
  { group: "Guest experience", label: "Website testimonials", href: "/admin/reviews/testimonials", keywords: "moderation reviews publish consent" },
  { group: "Finance", label: "Payments and ledger", href: "/admin/payments", keywords: "finance transactions refunds payments" },
  { group: "Performance", label: "Analytics", href: "/admin/extranet/analytics", keywords: "statistics occupancy revenue performance" },
  { group: "More", label: "Guest profiles", href: "/admin/guests", keywords: "crm repeat guests" },
  { group: "More", label: "Staff and access", href: "/admin/staff", keywords: "team roles mfa permissions" },
  { group: "More", label: "Audit log", href: "/admin/audit", keywords: "security history changes" },
];

export default function AdminPortalNav() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    return value ? items.filter((item) => (item.label + " " + item.group + " " + item.keywords).toLowerCase().includes(value)) : items;
  }, [query]);
  const groups = Array.from(new Set(filtered.map((item) => item.group)));

  return (
    <nav className="admin-portal-navigation" aria-label="Extranet navigation">
      <div className="admin-portal-navigation-inner">
        <label className="admin-search">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the extranet" aria-label="Search the extranet" />
          {query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button> : null}
        </label>
        <div className="admin-portal-nav-groups">
          {groups.map((group) => (
            <div key={group} className="admin-portal-nav-group">
              <p>{group}</p>
              {filtered.filter((item) => item.group === group).map((item) => {
                const active = pathname === item.href || (item.href !== "/admin/extranet" && pathname.startsWith(item.href));
                return <Link key={item.href} href={item.href} className={active ? "admin-portal-nav-link active" : "admin-portal-nav-link"}>{item.label}</Link>;
              })}
            </div>
          ))}
          {filtered.length === 0 ? <p className="admin-nav-empty">No matching tools. Try “rates”, “reviews” or “payments”.</p> : null}
        </div>
      </div>
    </nav>
  );
}
