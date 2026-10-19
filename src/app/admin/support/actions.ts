"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function replyToSupportThread(formData: FormData) {
  await requireStaff(["owner", "manager", "receptionist"]);
  const conversationId = String(formData.get("conversation_id") ?? "").trim();
  const body = String(formData.get("reply") ?? "").trim().slice(0, 4000);
  if (!validUuid(conversationId) || body.length < 2) redirect("/admin/support?error=validation");

  const service = createSupabaseServiceClient();
  if (!service) redirect("/admin/support?error=config");
  const { data: conversation, error: conversationError } = await service.from("guest_support_conversations")
    .select("id,guest_contact_email,guest_name,status")
    .eq("id", conversationId).maybeSingle();
  if (conversationError || !conversation || conversation.status === "closed") redirect("/admin/support?error=conversation");

  const { error: insertMessageError } = await service.from("guest_support_messages").insert({
    conversation_id: conversation.id,
    role: "staff",
    message: body,
    ai_provider: null,
    needs_staff: false,
  });
  if (insertMessageError) redirect("/admin/support?error=message");

  if (conversation.guest_contact_email) {
    const { error } = await service.from("email_outbox").insert({
      booking_id: null,
      kind: "guest_support_staff_reply",
      to_email: conversation.guest_contact_email,
      to_name: conversation.guest_name,
      subject: "Villa Memaj support reply · " + conversation.id.slice(-8).toUpperCase(),
      body_text: "Hello " + (conversation.guest_name || "there") + ",\n\n" + body +
        "\n\nSupport reference: " + conversation.id.slice(-8).toUpperCase() +
        "\n\nVilla Memaj · info@villamemaj.com\nPlease do not send full payment-card details by email.",
      status: "pending",
      scheduled_for: new Date().toISOString(),
    });
    if (error) redirect("/admin/support?error=email");
  } else {
    redirect("/admin/support?error=no_email");
  }

  const { error: updateError } = await service.from("guest_support_conversations").update({
    status: "open",
    requested_human: false,
    last_message_at: new Date().toISOString(),
  }).eq("id", conversation.id);
  if (updateError) redirect("/admin/support?error=conversation");
  revalidatePath("/admin/support");
  redirect("/admin/support?sent=1");
}

export async function closeSupportThread(formData: FormData) {
  await requireStaff(["owner", "manager", "receptionist"]);
  const conversationId = String(formData.get("conversation_id") ?? "").trim();
  if (!validUuid(conversationId)) redirect("/admin/support?error=validation");
  const service = createSupabaseServiceClient();
  if (!service) redirect("/admin/support?error=config");
  const { error } = await service.from("guest_support_conversations").update({
    status: "closed",
    resolved_at: new Date().toISOString(),
    requested_human: false,
  }).eq("id", conversationId);
  if (error) redirect("/admin/support?error=close");
  revalidatePath("/admin/support");
  redirect("/admin/support?closed=1");
}
