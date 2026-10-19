import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { closeSupportThread, replyToSupportThread } from "./actions";

export const dynamic = "force-dynamic";

type ThreadRow = {
  id: string;
  public_reference: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  locale: string;
  subject: string;
  status: string;
  source: string;
  last_message_at: string;
  created_at: string;
};

type MessageRow = {
  id: string;
  thread_id: string;
  sender_role: string;
  content: string;
  delivery_channel: string;
  created_at: string;
};

function date(value: string) {
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Tirane" });
}

export default async function SupportInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; closed?: string; error?: string }>;
}) {
  const { role } = await requireStaff(["owner", "manager", "receptionist"]);
  const params = await searchParams;
  const service = createSupabaseServiceClient();
  if (!service) {
    return <div className="admin-extranet-page"><h1>Support inbox</h1><p>Private support storage is not configured.</p></div>;
  }

  const { data, error } = await service
    .from("hotel_guest_support_threads")
    .select("id,public_reference,guest_name,guest_email,guest_phone,locale,subject,status,source,last_message_at,created_at")
    .order("last_message_at", { ascending: false })
    .limit(100);
  const threads = (data ?? []) as ThreadRow[];
  const ids = threads.map((thread) => thread.id);
  let messages: MessageRow[] = [];
  if (ids.length) {
    const { data: rows } = await service
      .from("hotel_guest_support_messages")
      .select("id,thread_id,sender_role,content,delivery_channel,created_at")
      .in("thread_id", ids)
      .order("created_at", { ascending: true })
      .limit(600);
    messages = (rows ?? []) as MessageRow[];
  }
  const grouped = new Map<string, MessageRow[]>();
  for (const message of messages) grouped.set(message.thread_id, [...(grouped.get(message.thread_id) ?? []), message]);

  return (
    <div className="admin-extranet-page">
      <div className="admin-extranet-page-header">
        <div>
          <p className="admin-eyebrow">Guest experience · Private inbox</p>
          <h1>Support inbox</h1>
          <p className="admin-page-intro">Website chat questions, AI replies and staff follow-up. The AI can answer routine property questions; anything uncertain should remain with a human team member.</p>
        </div>
        <Link href="/admin/extranet" className="admin-back-link">← Extranet home</Link>
      </div>

      {params.sent === "1" ? <p role="status" className="admin-portal-alert success">Reply queued for delivery. Check the Notifications outbox for its status.</p> : null}
      {params.closed === "1" ? <p role="status" className="admin-portal-alert success">Support thread closed.</p> : null}
      {params.error ? <p role="alert" className="admin-portal-alert warning">Action could not be completed ({params.error}). Check the thread and notification settings.</p> : null}
      {error ? <p role="alert" className="admin-portal-alert warning">Support threads could not be loaded.</p> : null}

      <div className="admin-extranet-metrics">
        <article><span>Threads shown</span><strong>{threads.length}</strong><small>Latest 100 threads</small></article>
        <article><span>Needs staff</span><strong>{threads.filter((thread) => thread.status === "waiting_for_staff" || thread.status === "open").length}</strong><small>New or handed off</small></article>
        <article><span>Waiting for guest</span><strong>{threads.filter((thread) => thread.status === "waiting_for_guest").length}</strong><small>Reply sent / awaiting guest</small></article>
        <article><span>Closed</span><strong>{threads.filter((thread) => thread.status === "closed" || thread.status === "resolved").length}</strong><small>Completed threads</small></article>
      </div>

      <div className="admin-support-thread-list">
        {threads.map((thread) => {
          const threadMessages = grouped.get(thread.id) ?? [];
          return (
            <section key={thread.id} className="admin-support-thread">
              <header className="admin-support-thread-header">
                <div>
                  <p className="admin-eyebrow">{thread.public_reference} · {thread.source} · {thread.locale.toUpperCase()}</p>
                  <h2>{thread.subject}</h2>
                  <p>{thread.guest_name || "Guest"}{thread.guest_email ? " · " + thread.guest_email : ""}{thread.guest_phone ? " · " + thread.guest_phone : ""}</p>
                </div>
                <div className="admin-support-thread-state">
                  <span className="admin-role-pill">{thread.status.replaceAll("_", " ")}</span>
                  <small>{date(thread.last_message_at)}</small>
                </div>
              </header>
              <div className="admin-support-message-list">
                {threadMessages.map((message) => (
                  <article key={message.id} className={"admin-support-message " + (message.sender_role === "guest" ? "guest" : message.sender_role === "assistant" ? "assistant" : "staff")}>
                    <div><strong>{message.sender_role === "guest" ? "Guest" : message.sender_role === "assistant" ? "AI assistant" : message.sender_role === "system" ? "System / handoff" : "Staff"}</strong><time>{date(message.created_at)}</time></div>
                    <p>{message.content}</p>
                  </article>
                ))}
              </div>
              {thread.status === "closed" ? (
                <p className="text-sm text-ink-soft">Thread closed.</p>
              ) : (
                <div className="admin-support-thread-actions">
                  <form action={replyToSupportThread} className="admin-support-reply-form">
                    <input type="hidden" name="thread_id" value={thread.id} />
                    <label className="admin-policy-field">
                      <span>Reply to guest by email</span>
                      <textarea name="reply" required minLength={2} maxLength={4000} rows={3} placeholder="Write a human-reviewed response. Replies are queued in the email outbox." />
                    </label>
                    <button type="submit" disabled={!thread.guest_email} className="admin-primary-link disabled:opacity-50">Queue email reply</button>
                    {!thread.guest_email ? <small>This guest did not provide an email address. Reply by another approved channel outside this form.</small> : null}
                  </form>
                  <form action={closeSupportThread}>
                    <input type="hidden" name="thread_id" value={thread.id} />
                    <button type="submit" className="admin-back-link">Close thread</button>
                  </form>
                </div>
              )}
            </section>
          );
        })}
        {!threads.length ? <div className="admin-panel"><p>No support messages have arrived yet.</p></div> : null}
      </div>
      <p className="admin-data-note">Access is limited to owner, manager and receptionist staff roles. Never paste payment-card numbers, banking codes or passwords into support notes.</p>
    </div>
  );
}
