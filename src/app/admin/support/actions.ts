"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { requireStaff } from "@/lib/admin/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function replyToSupportThread(formData: FormData) {
  await requireStaff(["owner", "manager", "receptionist"]);
  const threadId = String(formData.get("thread_id") ?? "").trim();
  const body = String(formData.get("reply") ?? "").trim().slice(0, 4000);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(threadId) || body.length < 2) {
    redirect("/admin/support?error=validation");
  }

  const service = createSupabaseServiceClient();
  if (!service) redirect("/admin/support?error=config");
  const { data: thread, error: threadError } = await service
    .from("hotel_guest_support_threads")
    .select("id,public_reference,guest_email,guest_name,status")
    .eq("id", threadId)
    .maybeSingle();
  if (threadError || !thread || thread.status === "closed") redirect("/admin/support?error=thread");

  const messageId = randomUUID();
  const { error: insertError } = await service.from("hotel_guest_support_messages").insert({
    id: messageId,
    thread_id: thread.id,
    sender_role: "staff",
    content: body,
    delivery_channel: "email",
    metadata: { staff_reply: true },
  });
  if (insertError) redirect("/admin/support?error=message");

  if (thread.guest_email) {
    const { error: emailError } = await service.from("email_outbox").insert({
      kind: "guest_support_staff_reply",
      to_email: thread.guest_email,
      to_name: thread.guest_name,
      subject: "Villa Memaj support reply " + thread.public_reference,
      body_text: "Hello " + (thread.guest_name || "there") + ",\n\n" + body +
        "\n\nSupport reference: " + thread.public_reference +
        "\n\nVilla Memaj · info@villamemaj.com\nPlease do not send full payment-card details by email.",
      dedupe_key: "support:" + thread.id + ":staff-reply:" + messageId,
    });
    if (emailError) redirect("/admin/support?error=email");
  }

  await service.from("hotel_guest_support_threads").update({
    status: "waiting_for_guest",
    last_message_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", thread.id);

  revalidatePath("/admin/support");
  redirect("/admin/support?sent=1");
}

export async function closeSupportThread(formData: FormData) {
  await requireStaff(["owner", "manager", "receptionist"]);
  const threadId = String(formData.get("thread_id") ?? "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(threadId)) {
    redirect("/admin/support?error=validation");
  }
  const service = createSupabaseServiceClient();
  if (!service) redirect("/admin/support?error=config");
  const { error } = await service.from("hotel_guest_support_threads").update({
    status: "closed",
    updated_at: new Date().toISOString(),
  }).eq("id", threadId);
  if (error) redirect("/admin/support?error=close");
  revalidatePath("/admin/support");
  redirect("/admin/support?closed=1");
}
