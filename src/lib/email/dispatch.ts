import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getEmailProvider } from "./provider";

interface OutboxRow {
  id: string;
  to_email: string;
  to_name: string | null;
  subject: string;
  body_text: string;
}

export interface DispatchSummary {
  configured: boolean;
  reason?: string;
  provider?: string;
  sent: number;
  failed: number;
}

const UNCONFIGURED: Pick<DispatchSummary, "sent" | "failed" | "configured"> = {
  configured: false,
  sent: 0,
  failed: 0,
};

/**
 * Drain a batch of queued notifications.
 *
 * Emails are enqueued by a database trigger, so nothing is lost while no provider is
 * configured. This is called both by /api/email/dispatch (cron / manual) and on CRM
 * activity, so notifications go out without depending on a paid cron tier.
 */
export async function dispatchQueuedEmails(limit = 25): Promise<DispatchSummary> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ...UNCONFIGURED, reason: "SUPABASE_SERVICE_ROLE_KEY is not set" };
  }

  const { provider, configured, reason } = getEmailProvider();
  if (!configured || !provider) {
    return { ...UNCONFIGURED, reason };
  }

  const { data, error } = await supabase.rpc("claim_outbox_emails", { p_limit: limit });
  if (error) {
    return { configured: true, provider: provider.name, sent: 0, failed: 0, reason: error.message };
  }

  const rows = (data ?? []) as OutboxRow[];
  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    const result = await provider.send({
      id: row.id,
      to: row.to_email,
      toName: row.to_name,
      subject: row.subject,
      body: row.body_text,
    });

    await supabase.rpc("finish_outbox_email", {
      p_id: row.id,
      p_ok: result.ok,
      p_provider: result.provider,
      p_message_id: result.messageId ?? null,
      p_error: result.error ?? null,
    });

    if (result.ok) sent += 1;
    else failed += 1;
  }

  return { configured: true, provider: provider.name, sent, failed };
}
