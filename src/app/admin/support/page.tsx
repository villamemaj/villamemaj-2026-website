import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";
import { replyToSupportConversation, resolveSupportConversation } from "./actions";

export const dynamic = "force-dynamic";

type Conversation = {
  id: string;
  locale: string;
  status: string;
  ai_provider: string | null;
  guest_contact_email: string | null;
  requested_human: boolean;
  created_at: string;
  last_message_at: string;
};
type Message = { id: string; conversation_id: string; role: string; message: string; created_at: string; needs_staff: boolean };

export default async function SupportInboxPage({ searchParams }: { searchParams: Promise<{ error?: string; replied?: string; resolved?: string }> }) {
  const { supabase, role } = await requireStaff(["owner", "manager", "receptionist"]);
  const params = await searchParams;
  const { data, error } = await supabase.from("guest_support_conversations").select("id,locale,status,ai_provider,guest_contact_email,requested_human,created_at,last_message_at").order("last_message_at", { ascending: false }).limit(100);
  const conversations = (data ?? []) as Conversation[];
  const ids = conversations.map((item) => item.id);
  const msgResult = ids.length
    ? await supabase.from("guest_support_messages").select("id,conversation_id,role,message,created_at,needs_staff").in("conversation_id", ids).order("created_at", { ascending: true }).limit(1000)
    : { data: [], error: null };
  const messages = (msgResult.data ?? []) as Message[];

  return (
    <div className="admin-extranet-page">
      <div className="admin-extranet-page-header">
        <div><p className="admin-eyebrow">Guest experience</p><h1>Support inbox</h1><p className="admin-page-intro">Review chat conversations and send staff replies. The AI assistant cannot access private booking records.</p></div>
        <Link href="/admin/extranet" className="admin-back-link">← Extranet home</Link>
      </div>
      {params.replied ? <div role="status" className="admin-portal-alert success">Your reply was saved to the conversation and queued for email where the guest provided an address.</div> : null}
      {params.resolved ? <div role="status" className="admin-portal-alert success">Conversation resolved.</div> : null}
      {params.error || error || msgResult.error ? <div role="alert" className="admin-portal-alert warning">The requested action could not be completed. Check staff permissions and database policies.</div> : null}
      {conversations.length === 0 ? <div className="admin-panel"><h2>No support conversations yet</h2><p className="admin-panel-copy">Guest chat questions will appear here. Configure Slack or WhatsApp credentials to receive owner alerts for escalated requests.</p></div> : (
        <div className="admin-support-list">
          {conversations.map((conversation) => (
            <article key={conversation.id} className="admin-panel admin-support-card">
              <div className="admin-section-heading">
                <div><p className="admin-eyebrow">Conversation · {conversation.locale.toUpperCase()}</p><h2>{conversation.status === "waiting_staff" ? "Needs staff response" : conversation.status.replaceAll("_", " ")}</h2></div>
                <span className={conversation.requested_human ? "admin-role-pill warning" : "admin-role-pill"}>{conversation.requested_human ? "Escalated" : (conversation.ai_provider || "Support")}</span>
              </div>
              <p className="admin-support-meta">Started {new Date(conversation.created_at).toLocaleString("en-GB")} · Last message {new Date(conversation.last_message_at).toLocaleString("en-GB")}</p>
              {conversation.guest_contact_email ? <p className="admin-support-meta">Guest contact: <a className="underline" href={"mailto:" + conversation.guest_contact_email}>{conversation.guest_contact_email}</a></p> : <p className="admin-support-meta">No follow-up email was provided.</p>}
              <div className="admin-support-messages">
                {messages.filter((message) => message.conversation_id === conversation.id).map((message) => (
                  <div key={message.id} className={"admin-support-message " + message.role}>
                    <div><strong>{message.role === "guest" ? "Guest" : message.role === "assistant" ? "Assistant" : message.role === "staff" ? "Staff" : "System"}</strong><time>{new Date(message.created_at).toLocaleString("en-GB")}</time></div>
                    <p>{message.message}</p>
                  </div>
                ))}
              </div>
              {conversation.status !== "resolved" && conversation.status !== "closed" ? (
                <div className="admin-support-actions">
                  <form action={replyToSupportConversation} className="admin-support-reply">
                    <input type="hidden" name="conversationId" value={conversation.id} />
                    <label><span>Staff reply</span><textarea name="reply" minLength={2} maxLength={5000} required rows={3} placeholder="Write a clear, helpful reply…" /></label>
                    <button type="submit" className="admin-primary-link">Save reply{conversation.guest_contact_email ? " and queue email" : ""}</button>
                  </form>
                  {role !== "receptionist" ? <form action={resolveSupportConversation}><input type="hidden" name="conversationId" value={conversation.id} /><button type="submit" className="admin-secondary-link">Mark resolved</button></form> : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
