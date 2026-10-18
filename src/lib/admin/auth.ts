import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  if (!user) return { user: null, role: null as StaffRole | null, supabase };

  const { data: membership } = await supabase
    .from("hotel_staff_memberships")
    .select("role, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  const role =
    membership?.is_active === true ? (membership.role as StaffRole) : null;

  return { user, role, supabase };
}

export async function requireStaff(roles?: StaffRole[]) {
  const { user, role, supabase } = await getStaff();

  if (!user) redirect("/admin/login");
  if (!role) redirect("/admin/login?error=no-role");
  if (roles && !roles.includes(role)) redirect("/admin");

  return { user: user!, userId: user!.id, role: role!, supabase };
}
