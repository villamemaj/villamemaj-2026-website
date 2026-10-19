"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin/auth";

function formText(data: FormData, name: string, max: number) {
  const value = data.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function replyToSupportConversation(formData: FormData) {
  const { supabase, userId } = await requireStaff(["owner", "manager", "receptionist"]);
  const id = formText(formData, "conversationId", 64);
  const reply = formText(formData, "reply", 5000);
  if (!/^[0-9a-f-]{36}$/i.test(id) || reply.length < 2) redirect("/admin/support?error=validation");

  const { data: conversation, error: lookupError } = await supabase
    .from("guest_support_conversations")
    .select("id,guest_contact_email")
    .eq("id", id)
    .maybeSingle();
  if (lookupError || !conversation) redirect("/admin/support?error=lookup");

  const { error: messageError } = await supabase.from("guest_support_messages").insert({
    conversation_id: id, role: "staff", message: reply, needs_staff: false,
  });
  if (messageError) redirect("/admin/support?error=reply");

  if (conversation.guest_contact_email) {
    const { error: emailError } = await supabase.from("email_outbox").insert({
      booking_id: null,
      kind: "support_reply_" + crypto.randomUUID(),
      to_email: conversation.guest_contact_email,
      to_name: null,
      subject: "A reply from Villa Memaj",
      body_text: reply + "\n\nVilla Memaj · info@villamemaj.com",
      scheduled_for: new Date().toISOString(),
    });
    if (emailError) redirect("/admin/support?error=email");
  }

  await supabase.from("guest_support_conversations").update({
    status: "open", requested_human: false, last_message_at: new Date().toISOString(),
  }).eq("id", id);
  void userId;
  revalidatePath("/admin/support");
  redirect("/admin/support?replied=1");
}

export async function resolveSupportConversation(formData: FormData) {
  const { supabase } = await requireStaff(["owner", "manager"]);
  const id = formText(formData, "conversationId", 64);
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin/support?error=validation");
  const { error } = await supabase.from("guest_support_conversations").update({
    status: "resolved", requested_human: false, resolved_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) redirect("/admin/support?error=resolve");
  revalidatePath("/admin/support");
  redirect("/admin/support?resolved=1");
}
