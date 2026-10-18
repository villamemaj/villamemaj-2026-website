import { requireStaff, STAFF_ROLE_LABELS, type StaffRole } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, inputClass, labelClass, buttonClass, buttonSecondaryClass, EmptyState } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/admin/format";
import { createStaff, setStaffRole, setStaffActive } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

const ALL_ROLES: StaffRole[] = ["owner", "manager", "receptionist", "housekeeping", "accountant"];
const MANAGER_GRANTABLE: StaffRole[] = ["receptionist", "housekeeping", "accountant"];

interface StaffRow {
  user_id: string;
  email: string;
  full_name: string;
  role: StaffRole;
  is_active: boolean;
  created_at: string;
}

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { role } = await requireStaff(["owner", "manager"]);
  const { ok, error } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase.rpc("admin_list_staff");
  const staff = (data ?? []) as StaffRow[];

  const grantable = role === "owner" ? ALL_ROLES : MANAGER_GRANTABLE;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Staff accounts</h1>
        <p className="text-sm text-slate-500">
          Provision individual logins and roles. There are no shared accounts; every action is attributed and logged.
        </p>
      </div>

      {ok === "created" && (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Staff account created. Share the password securely and ask them to change it on first sign-in.
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <Card title="Create account">
        <form action={createStaff} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelClass}>Full name</label>
            <input name="full_name" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input name="email" type="email" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Temporary password (min 8)</label>
            <input name="password" type="text" required minLength={8} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Role</label>
            <select name="role" className={inputClass} defaultValue={grantable[0]}>
              {grantable.map((r) => (
                <option key={r} value={r}>
                  {STAFF_ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <button className={buttonClass}>Create staff account</button>
          </div>
        </form>
      </Card>

      <Card title="Team">
        {staff.length === 0 ? (
          <EmptyState>No staff accounts.</EmptyState>
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-2 font-medium">Name</th>
                  <th className="px-5 py-2 font-medium">Email</th>
                  <th className="px-5 py-2 font-medium">Role</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium">Added</th>
                  <th className="px-5 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((s) => (
                  <tr key={s.user_id}>
                    <td className="px-5 py-3 font-medium text-slate-900">{s.full_name}</td>
                    <td className="px-5 py-3 text-slate-600">{s.email}</td>
                    <td className="px-5 py-3">
                      <form action={setStaffRole} className="flex items-center gap-2">
                        <input type="hidden" name="user_id" value={s.user_id} />
                        <select name="role" defaultValue={s.role} className="rounded-lg border border-slate-300 px-2 py-1 text-sm">
                          {(role === "owner" ? ALL_ROLES : MANAGER_GRANTABLE).concat(
                            s.role === "owner" || s.role === "manager" ? [s.role] : []
                          ).filter((v, i, a) => a.indexOf(v) === i).map((r) => (
                            <option key={r} value={r}>
                              {STAFF_ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>
                        <button className="text-xs font-semibold text-sky-700 hover:underline">Update</button>
                      </form>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-500"}`}>
                        {s.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{formatDateTime(s.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <form action={setStaffActive}>
                        <input type="hidden" name="user_id" value={s.user_id} />
                        <input type="hidden" name="active" value={s.is_active ? "false" : "true"} />
                        <button className={buttonSecondaryClass}>
                          {s.is_active ? "Disable" : "Enable"}
                        </button>
                      </form>
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
