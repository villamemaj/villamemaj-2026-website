import { requireStaff } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, EmptyState } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

function changedFields(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
): string[] {
  if (!before && after) return Object.keys(after).slice(0, 6);
  if (before && !after) return Object.keys(before).slice(0, 6);
  if (!before || !after) return [];
  return Object.keys(after).filter(
    (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key])
  );
}

export default async function AuditPage() {
  await requireStaff(["owner", "manager"]);
  const supabase = await createSupabaseServerClient();

  const [{ data: entries }, { data: staff }] = await Promise.all([
    supabase
      .from("hotel_audit_log")
      .select("id, actor_user_id, action, entity_type, entity_id, before_data, after_data, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("hotel_staff_memberships").select("user_id, role"),
  ]);

  const roleByUser = new Map((staff ?? []).map((s) => [s.user_id, s.role]));
  const rows = entries ?? [];

  const ACTION_STYLE: Record<string, string> = {
    create: "bg-emerald-100 text-emerald-800",
    update: "bg-sky-100 text-sky-800",
    delete: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Audit log</h1>
        <p className="text-sm text-slate-500">
          Immutable history of changes to bookings, payments, rooms, rates and policies. Written by database triggers.
        </p>
      </div>

      <Card>
        {rows.length === 0 ? (
          <EmptyState>No audit entries yet.</EmptyState>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {rows.map((e) => {
              const fields = changedFields(
                e.before_data as Record<string, unknown> | null,
                e.after_data as Record<string, unknown> | null
              );
              return (
                <li key={e.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_STYLE[e.action] ?? "bg-slate-100 text-slate-600"}`}>
                        {e.action}
                      </span>
                      <span className="font-medium text-slate-900">{e.entity_type}</span>
                      <span className="font-mono text-xs text-slate-400">
                        {e.entity_id ? e.entity_id.slice(0, 8) : "—"}
                      </span>
                    </div>
                    {fields.length > 0 && (
                      <p className="mt-1 text-xs text-slate-500">
                        {fields.slice(0, 6).join(", ")}
                        {fields.length > 6 ? ` +${fields.length - 6} more` : ""}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p>{formatDateTime(e.created_at)}</p>
                    <p>{e.actor_user_id ? roleByUser.get(e.actor_user_id) ?? "staff" : "system"}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
