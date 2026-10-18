import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStaff } from "@/lib/admin/auth";
import MfaPanel from "@/components/admin/MfaPanel";

export const metadata: Metadata = {
  title: "Two-factor authentication",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function MfaPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const { user, mfa } = await getStaff();

  if (!user) redirect("/admin/login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Villa Memaj CRM
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Two-factor authentication
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Signed in as {user.email}. Protect the property data with an authenticator app.
          </p>
        </div>

        <MfaPanel
          next={next ?? "/admin"}
          initialVerified={mfa.verified}
          initialHasFactor={mfa.nextLevel === "aal2"}
        />
      </div>
    </div>
  );
}
