import { requireStaff, STAFF_ROLE_LABELS } from "@/lib/admin/auth";
import { Card } from "@/components/admin/ui";
import ChangePasswordForm from "@/components/admin/ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { user, role } = await requireStaff();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">My account</h1>
        <p className="text-sm text-slate-500">
          Signed in as {user.email} · {STAFF_ROLE_LABELS[role]}
        </p>
      </div>

      <Card title="Change password">
        <p className="mb-4 text-sm text-slate-500">
          Choose a strong password you do not use elsewhere. You will stay signed in after changing it.
        </p>
        <ChangePasswordForm email={user.email ?? ""} />
      </Card>

      <Card title="Security">
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
          <li>Staff accounts are individual — never share logins.</li>
          <li>Every change you make is recorded in the audit log with your user id.</li>
          <li>Two-factor authentication (MFA) and email confirmations are planned for a later phase.</li>
        </ul>
      </Card>
    </div>
  );
}
