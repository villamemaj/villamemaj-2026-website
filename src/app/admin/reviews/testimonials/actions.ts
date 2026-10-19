"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin/auth";

export async function updateTestimonialPublication(formData: FormData) {
  const { supabase, userId } = await requireStaff(["owner", "manager"]);
  const id = formData.get("id");
  const desired = formData.get("publish") === "true";
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin/reviews/testimonials?error=validation");

  const { data: row, error: readError } = await supabase
    .from("guest_testimonials")
    .select("id,consent_to_publish")
    .eq("id", id)
    .maybeSingle();
  if (readError || !row || (desired && row.consent_to_publish !== true)) redirect("/admin/reviews/testimonials?error=consent");

  const { error } = await supabase.from("guest_testimonials").update({
    is_published: desired,
    approved_at: desired ? new Date().toISOString() : null,
    approved_by: desired ? userId : null,
  }).eq("id", id);
  if (error) redirect("/admin/reviews/testimonials?error=save");

  revalidatePath("/admin/reviews/testimonials");
  for (const locale of ["en", "el", "fr", "sq", "de", "it"]) revalidatePath("/" + locale + "/reviews");
  redirect("/admin/reviews/testimonials?saved=1");
}
