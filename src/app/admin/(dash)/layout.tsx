import Link from "next/link";
import AdminNav, { type NavItem } from "@/components/admin/AdminNav";
import { requireStaff, STAFF_ROLE_LABELS } from "@/lib/admin/auth";
import { signOut } from "@/lib/admin/auth-actions";

const ALL_ITEMS: (NavItem & { roles?: string[] })[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/reservations", label: "Reservations", roles: ["owner", "manager", "receptionist", "accountant"] },
  { href: "/admin/calendar", label: "Calendar", roles: ["owner", "manager", "receptionist", "housekeeping"] },
  { href: "/admin/rooms", label: "Rooms & rates", roles: ["owner", "manager", "receptionist"] },
  { href: "/admin/rate-plans", label: "Rate plans", roles: ["owner", "manager", "receptionist"] },
  { href: "/admin/guests", label: "Guests", roles: ["owner", "manager", "receptionist", "accountant"] },
  { href: "/admin/payments", label: "Payments", roles: ["owner", "manager", "receptionist", "accountant"] },
  { href: "/admin/policies", label: "Policies", roles: ["owner", "manager"] },
  { href: "/admin/notifications", label: "Notifications", roles: ["owner", "manager"] },
  { href: "/admin/staff", label: "Staff", roles: ["owner", "manager"] },
  { href: "/admin/audit", label: "Audit log", roles: ["owner", "manager"] },
  { href: "/admin/account", label: "My account" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, mfa } = await requireStaff();

  const items = ALL_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(role)
  ).map(({ href, label }) => ({ href, label }));

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-5 lg:flex">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Villa Memaj
          </p>
          <p className="text-lg font-semibold text-slate-900">Property manager</p>
        </div>

        <AdminNav items={items} />

        <div className="mt-auto pt-6">
          <div className="rounded-xl bg-slate-100 p-3">
            <p className="truncate text-xs font-medium text-slate-700">
              {user.email}
            </p>
            <p className="text-xs text-slate-500">{STAFF_ROLE_LABELS[role]}</p>
          </div>
          <form action={signOut} className="mt-3">
            <button
              type="submit"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3 lg:hidden">
          <span className="font-semibold">Villa Memaj CRM</span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            >
              Sign out
            </button>
          </form>
        </header>
        <div className="lg:hidden">
          <div className="border-b border-slate-200 bg-white p-3">
            <AdminNav items={items} />
          </div>
        </div>

        <main className="min-w-0 flex-1 p-5 lg:p-8">
          {mfa.shouldEnrol && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-900">
                Two-factor authentication is off. A stolen password alone would expose guest
                details, payments and staff accounts.
              </p>
              <Link
                href="/admin/mfa"
                className="rounded-lg bg-amber-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-800"
              >
                Set up now
              </Link>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
