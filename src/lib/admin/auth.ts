import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMfaStatus, NO_MFA, STRICT_MFA_ENROLMENT } from "@/lib/admin/mfa";

export type StaffRole =
  | "owner"
  | "manager"
  | "receptionist"
  | "housekeeping"
  | "accountant";

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  owner: "Owner",
  manager: "Manager",
  receptionist: "Receptionist",
  housekeeping: "Housekeeping",
  accountant: "Accountant",
};

export async function getStaff() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, role: null as StaffRole | null, supabase, mfa: NO_MFA };
  }

  const { data: membership } = await supabase
    .from("hotel_staff_memberships")
    .select("role, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  const role =
    membership?.is_active === true ? (membership.role as StaffRole) : null;

  const mfa = await getMfaStatus(supabase, role, user);

  return { user, role, supabase, mfa };
}

export async function requireStaff(roles?: StaffRole[]) {
  const { user, role, supabase, mfa } = await getStaff();

  if (!user) redirect("/admin/login");
  if (!role) redirect("/admin/login?error=no-role");
  if (roles && !roles.includes(role)) redirect("/admin");

  // Two-factor: once a factor is enrolled every admin page requires the code for this
  // session. Verification happens outside this layout (/admin/mfa), so no loop.
  if (mfa.needsVerification) redirect("/admin/mfa");
  if (STRICT_MFA_ENROLMENT && mfa.shouldEnrol) redirect("/admin/mfa?enrol=1");

  return { user: user!, userId: user!.id, role: role!, supabase, mfa };
}
