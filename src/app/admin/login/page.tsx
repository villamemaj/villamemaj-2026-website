import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Staff sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Villa Memaj
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Property manager
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in with your staff account.
          </p>
        </div>

        {error === "no-role" && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            This account has no active staff role. Ask the owner to grant access.
          </p>
        )}

        <LoginForm next={next ?? "/admin"} />

        <p className="mt-6 text-xs text-slate-400">
          Staff accounts are provisioned by the owner. All actions are logged.
        </p>
      </div>
    </div>
  );
}
