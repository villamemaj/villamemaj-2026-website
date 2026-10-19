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
  const { error } = await supabase
    .from("hotel_guest_reviews")
    .update({
      status: decision,
      moderation_note: note || null,
      moderated_by: userId,
      published_at: decision === "published" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId);
  if (error) redirect("/admin/guest-reviews?error=save");

  revalidatePath("/admin/guest-reviews");
  revalidatePath("/en/reviews");
  revalidatePath("/el/reviews");
  revalidatePath("/fr/reviews");
  revalidatePath("/sq/reviews");
  revalidatePath("/de/reviews");
  redirect("/admin/guest-reviews?saved=1");
}
