import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { closeSupportThread, replyToSupportThread } from "./actions";

export const dynamic = "force-dynamic";

type ConversationRow = {
  id: string;
  guest_name: string | null;
  guest_contact_email: string | null;
  guest_phone: string | null;
  locale: string;
  status: "open" | "waiting_staff" | "resolved" | "closed";
  ai_provider: string | null;
  requested_human: boolean;
  last_message_at: string;
  created_at: string;
};
type MessageRow = {
  id: string;
  conversation_id: string;
  role: "guest" | "assistant" | "staff" | "system";
  message: string;
  ai_provider: string | null;
  needs_staff: boolean;
  created_at: string;
};
function date(value: string) {
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Tirane" });
}
function reference(id: string) { return id.slice(-8).toUpperCase(); }

export default async function SupportInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; closed?: string; error?: string }>;
}) {
  await requireStaff(["owner", "manager", "receptionist"]);
  const params = await searchParams;
  const service = createSupabaseServiceClient();
  if (!service) return <div className="admin-extranet-page"><h1>Support inbox</h1><p>Private support storage is not configured.</p></div>;

  const { data, error } = await service.from("guest_support_conversations")
    .select("id,guest_name,guest_contact_email,guest_phone,locale,status,ai_provider,requested_human,last_message_at,created_at")
    .order("last_message_at", { ascending: false }).limit(100);
  const conversations = (data ?? []) as ConversationRow[];
  const ids = conversations.map(c => c.id);
  let messages: MessageRow[] = [];
  if (ids.length) {
    const { data: rows } = await service.from("guest_support_messages")
      .select("id,conversation_id,role,message,ai_provider,needs_staff,created_at")
      .in("conversation_id", ids).order("created_at", { ascending: true }).limit(600);
    messages = (rows ?? []) as MessageRow[];
  }
  const grouped = new Map<string, MessageRow[]>();
  for (const msg of messages) grouped.set(msg.conversation_id, [...(grouped.get(msg.conversation_id) ?? []), msg]);

  return (
    <div className="admin-extranet-page">
      <div className="admin-extranet-page-header">
        <div>
          <p className="admin-eyebrow">Guest experience · Private inbox</p>
          <h1>Support inbox</h1>
          <p className="admin-page-intro">Website chat, AI replies and human follow-up. Booking, payment, cancellation and refund decisions stay with authorised staff.</p>
        </div>
        <Link href="/admin/extranet" className="admin-back-link">← Extranet home</Link>
      </div>
      {params.sent === "1" ? <p role="status" className="admin-portal-alert success">Reply queued for delivery.</p> : null}
      {params.closed === "1" ? <p role="status" className="admin-portal-alert success">Conversation closed.</p> : null}
      {params.error ? <p role="alert" className="admin-portal-alert warning">Action could not be completed ({params.error}).</p> : null}
      {error ? <p role="alert" className="admin-portal-alert warning">Support conversations could not be loaded.</p> : null}

      <div className="admin-extranet-metrics">
        <article><span>Conversations shown</span><strong>{conversations.length}</strong><small>Latest 100 conversations</small></article>
        <article><span>Needs staff</span><strong>{conversations.filter(c => c.status === "waiting_staff" || c.requested_human).length}</strong><small>Human follow-up requested or required</small></article>
        <article><span>Open</span><strong>{conversations.filter(c => c.status === "open").length}</strong><small>Active guest conversations</small></article>
        <article><span>Resolved / closed</span><strong>{conversations.filter(c => c.status === "resolved" || c.status === "closed").length}</strong><small>Completed conversations</small></article>
      </div>

      <div className="admin-support-thread-list">
        {conversations.map(conversation => {
          const history = grouped.get(conversation.id) ?? [];
          const firstGuestMessage = history.find(m => m.role === "guest")?.message || "Guest question";
          return (
            <section key={conversation.id} className="admin-support-thread">
              <header className="admin-support-thread-header">
                <div>
                  <p className="admin-eyebrow">SUP-{reference(conversation.id)} · {conversation.locale.toUpperCase()}</p>
                  <h2>{firstGuestMessage.split(/\r?\n/, 1)[0].slice(0, 120)}</h2>
                  <p>{conversation.guest_name || "Guest"}{conversation.guest_contact_email ? " · " + conversation.guest_contact_email : ""}{conversation.guest_phone ? " · " + conversation.guest_phone : ""}</p>
                </div>
                <div className="admin-support-thread-state">
                  <span className="admin-role-pill">{conversation.requested_human ? "Human requested" : conversation.status.replaceAll("_", " ")}</span>
                  <small>{date(conversation.last_message_at)}</small>
                </div>
              </header>
              <div className="admin-support-message-list">
                {history.map(msg => (
                  <article key={msg.id} className={"admin-support-message " + (msg.role === "guest" ? "guest" : msg.role === "assistant" ? "assistant" : "staff")}>
                    <div>
                      <strong>{msg.role === "guest" ? "Guest" : msg.role === "assistant" ? "AI assistant" : msg.role === "system" ? "System / handoff" : "Staff"}</strong>
                      <time>{date(msg.created_at)}</time>
                    </div>
                    <p>{msg.message}</p>
                    {msg.needs_staff ? <small className="mt-2 block font-semibold text-amber-800">Human follow-up required</small> : null}
                  </article>
                ))}
              </div>
              {conversation.status === "closed" || conversation.status === "resolved" ? (
                <p className="text-sm text-ink-soft">Conversation {conversation.status}.</p>
              ) : (
                <div className="admin-support-thread-actions">
                  <form action={replyToSupportThread} className="admin-support-reply-form">
                    <input type="hidden" name="conversation_id" value={conversation.id} />
                    <label className="admin-policy-field">
                      <span>Reply to guest by email</span>
                      <textarea name="reply" required minLength={2} maxLength={4000} rows={3} placeholder="Write a human-reviewed response. Replies are queued in the email outbox." />
                    </label>
                    <button type="submit" disabled={!conversation.guest_contact_email} className="admin-primary-link disabled:opacity-50">Queue email reply</button>
                    {!conversation.guest_contact_email ? <small>The guest did not provide an email address; use another approved contact route.</small> : null}
                  </form>
                  <form action={closeSupportThread}>
                    <input type="hidden" name="conversation_id" value={conversation.id} />
                    <button type="submit" className="admin-back-link">Close conversation</button>
                  </form>
                </div>
              )}
            </section>
          );
        })}
        {!conversations.length ? <div className="admin-panel"><p>No support conversations have arrived yet.</p></div> : null}
      </div>
      <p className="admin-data-note">Access is limited to owner, manager and receptionist staff. Never paste card numbers, bank codes or passwords into support notes.</p>
    </div>
  );
}
