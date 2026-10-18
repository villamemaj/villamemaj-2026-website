import { requireStaff } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, EmptyState } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/admin/format";
import { dispatchQueuedEmails } from "@/lib/email/dispatch";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  booking_guest_ack: "Guest acknowledgement",
  booking_owner_alert: "Owner alert",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  sending: "bg-sky-100 text-sky-800",
  sent: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-700",
  skipped: "bg-slate-200 text-slate-600",
};

interface OutboxRow {
  id: string;
  booking_id: string | null;
  kind: string;
  to_email: string;
  subject: string;
  status: string;
  attempts: number;
  last_error: string | null;
  scheduled_for: string;
  sent_at: string | null;
  created_at: string;
}

export default async function NotificationsPage() {
  const { role } = await requireStaff(["owner", "manager"]);

  // Emails are queued in the database by a trigger. Flushing here means alerts go out
  // whenever staff use the CRM, so delivery does not depend on a paid cron tier.
  const summary = await dispatchQueuedEmails(10);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("admin_list_outbox", { p_limit: 200 });
  const rows = (data ?? []) as OutboxRow[];

  const queued = rows.filter((r) => r.status === "pending" || r.status === "sending").length;
  const failed = rows.filter((r) => r.status === "failed").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Notifications</h1>
        <p className="text-sm text-slate-500">
          {queued} queued · {failed} failed · {rows.length} total. Notifications are created
          automatically for every booking request and kept until they are delivered.
        </p>
      </div>

      {!summary.configured && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Email sending is not configured yet{summary.reason ? ` (${summary.reason})` : ""}. Requests are
          being queued safely and will all be delivered once a provider key is added — nothing is lost.
        </p>
      )}

      {summary.configured && (summary.sent > 0 || summary.failed > 0) && (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Dispatched via {summary.provider}: {summary.sent} sent, {summary.failed} failed.
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error.message}</p>
      )}

      <Card title="Outbox">
        {rows.length === 0 ? (
          <EmptyState>Nothing queued.</EmptyState>
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-2 font-medium">Type</th>
                  <th className="px-5 py-2 font-medium">To</th>
                  <th className="px-5 py-2 font-medium">Subject</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-5 py-3 text-slate-600">{KIND_LABELS[row.kind] ?? row.kind}</td>
                    <td className="px-5 py-3 text-slate-600">{row.to_email}</td>
                    <td className="px-5 py-3 text-slate-900">
                      {row.subject}
                      {row.last_error && (
                        <span className="mt-1 block text-xs text-red-600">{row.last_error}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[row.status] ?? "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {row.status}
                        {row.attempts > 1 ? ` · ${row.attempts}` : ""}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {formatDateTime(row.created_at)}
                      {row.sent_at && (
                        <span className="block text-emerald-600">sent {formatDateTime(row.sent_at)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {role === "owner" && (
        <Card title="Setup">
          <p className="text-sm text-slate-600">
            To start sending, set these environment variables (Vercel → Settings → Environment Variables):
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-600">
            <li><code>EMAIL_PROVIDER</code> — <code>resend</code> (live) or <code>log</code> (dry run)</li>
            <li><code>RESEND_API_KEY</code> — from resend.com; verify the sending domain to use <code>info@villamemaj.com</code></li>
            <li><code>EMAIL_FROM</code> — e.g. <code>Villa Memaj &lt;bookings@villamemaj.com&gt;</code></li>
            <li><code>SUPABASE_SERVICE_ROLE_KEY</code> — from Supabase project settings, needed to drain the queue</li>
            <li><code>CRON_SECRET</code> — any long random string, for scheduled/manual runs of <code>/api/email/dispatch</code></li>
          </ul>
        </Card>
      )}
    </div>
  );
}
