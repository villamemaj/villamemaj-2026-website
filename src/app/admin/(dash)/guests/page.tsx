import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, EmptyState, inputClass, labelClass, buttonSecondaryClass } from "@/components/admin/ui";
import { formatDate, formatDateTime } from "@/lib/admin/format";
import { updateGuestNotes } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

export default async function GuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireStaff(["owner", "manager", "receptionist", "accountant"]);
  const { q = "" } = await searchParams;
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("guests")
    .select("id, email, full_name, phone, country, notes, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);
  const term = q.trim();
  if (term) {
    query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
  }

  const { data: guests } = await query;
  const rows = guests ?? [];

  const { data: bookings } = await supabase
    .from("hotel_bookings")
    .select("guest_email, status, check_in")
    .limit(1000);
  const byEmail = new Map<string, { total: number; last: string }>();
  for (const b of bookings ?? []) {
    const key = (b.guest_email ?? "").toLowerCase();
    const entry = byEmail.get(key) ?? { total: 0, last: "" };
    entry.total += 1;
    if (b.check_in > entry.last) entry.last = b.check_in;
    byEmail.set(key, entry);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Guests</h1>
          <p className="text-sm text-slate-500">{rows.length} profile(s)</p>
        </div>
        <form action="/admin/guests" className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="Search name, email or phone…" className={`${inputClass} w-64`} />
          <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Search</button>
        </form>
      </div>

      {rows.length === 0 ? (
        <EmptyState>No guest profiles {term ? "match this search" : "yet"}.</EmptyState>
      ) : (
        <div className="space-y-3">
          {rows.map((g) => {
            const stats = byEmail.get(g.email.toLowerCase());
            return (
              <Card key={g.id}>
                <details>
                  <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{g.full_name}</p>
                      <p className="text-xs text-slate-500">
                        {g.email}
                        {g.phone ? ` · ${g.phone}` : ""}
                        {g.country ? ` · ${g.country}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <Link
                        href={`/admin/reservations?q=${encodeURIComponent(g.email)}`}
                        className="text-sky-700 hover:underline"
                      >
                        {stats?.total ?? 0} booking(s)
                      </Link>
                      {stats?.last && <span>Last stay {formatDate(stats.last)}</span>}
                    </div>
                  </summary>

                  <form action={updateGuestNotes} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <input type="hidden" name="guest_id" value={g.id} />
                    <div>
                      <label className={labelClass}>Full name</label>
                      <input name="full_name" defaultValue={g.full_name} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Phone</label>
                      <input name="phone" defaultValue={g.phone ?? ""} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Country</label>
                      <input name="country" defaultValue={g.country ?? ""} className={inputClass} />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-4">
                      <label className={labelClass}>Notes</label>
                      <textarea name="notes" defaultValue={g.notes ?? ""} rows={2} className={inputClass} />
                    </div>
                    <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
                      <button className={buttonSecondaryClass}>Save guest</button>
                      <span className="text-xs text-slate-400">
                        Updated {formatDateTime(g.updated_at)}
                      </span>
                    </div>
                  </form>
                </details>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
