"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function moderateGuestReview(formData: FormData) {
  const { userId } = await requireStaff(["owner", "manager"]);
  const reviewId = String(formData.get("review_id") ?? "").trim();
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("moderation_note") ?? "").trim().slice(0, 1000);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(reviewId)
    || !["published", "rejected", "pending"].includes(decision)) {
    redirect("/admin/guest-reviews?error=validation");
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) redirect("/admin/guest-reviews?error=config");

  const { data: review, error: readError } = await supabase
    .from("guest_testimonials")
    .select("id,consent_to_publish")
    .eq("id", reviewId)
    .maybeSingle();
  if (readError || !review) redirect("/admin/guest-reviews?error=not-found");
  if (decision === "published" && !review.consent_to_publish) {
    redirect("/admin/guest-reviews?error=consent");
  }

  const publish = decision === "published";
  const { error } = await supabase
    .from("guest_testimonials")
    .update({
      moderation_status: decision,
      is_published: publish,
      approved_at: publish ? new Date().toISOString() : null,
      approved_by: decision === "pending" ? null : userId,
      moderation_note: note || null,
    })
    .eq("id", reviewId);
  if (error) redirect("/admin/guest-reviews?error=save");

  revalidatePath("/admin/guest-reviews");
  for (const locale of ["en", "el", "fr", "sq", "de"]) revalidatePath("/" + locale + "/reviews");
  redirect("/admin/guest-reviews?saved=1");
}
