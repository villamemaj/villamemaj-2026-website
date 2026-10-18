import Link from "next/link";
import { requireStaff, STAFF_ROLE_LABELS } from "@/lib/admin/auth";
import { Card } from "@/components/admin/ui";
import ChangePasswordForm from "@/components/admin/ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { user, role, mfa } = await requireStaff();

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

      <Card
        title="Two-factor authentication"
        action={
          <Link
            href="/admin/mfa"
            className="text-xs font-medium text-slate-700 underline hover:text-slate-900"
          >
            {mfa.verified ? "Manage" : "Set up"}
          </Link>
        }
      >
        <p className="text-sm text-slate-600">
          {mfa.verified
            ? "Active. This session passed the second factor."
            : mfa.nextLevel === "aal2"
              ? "Required for this session — enter your authenticator code to continue."
              : "Not set up. Your password alone currently protects guest details and payments."}
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Uses any TOTP app (Google Authenticator, Authy, 1Password). You will be asked for a code
          when signing in from a new browser.
        </p>
      </Card>

      <Card title="Security">
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
          <li>Staff accounts are individual — never share logins.</li>
          <li>Every change you make is recorded in the audit log with your user id.</li>
          <li>Staff accounts are created by the owner; you can change your own password above.</li>
        </ul>
      </Card>
    </div>
  );
}
