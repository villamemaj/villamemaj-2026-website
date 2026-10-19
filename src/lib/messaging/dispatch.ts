import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getGuestMessageProvider } from "./provider";

export interface GuestMessageDispatchSummary {
  configured: boolean;
  reason?: string;
  provider?: string;
  sent: number;
  failed: number;
}

type SmsOutboxRow = {
  id: string;
  booking_id: string | null;
  kind: string;
  to_phone: string;
  body_text: string;
};

export async function dispatchQueuedGuestMessages(limit = 25, _bookingId?: string): Promise<GuestMessageDispatchSummary> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return { configured: false, reason: "SUPABASE_SERVICE_ROLE_KEY is not set", sent: 0, failed: 0 };
  const provider = getGuestMessageProvider();
  if (!provider) {
    return { configured: false, reason: "Twilio SMS is not configured; add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_SMS_FROM.", sent: 0, failed: 0 };
  }
  const { data, error } = await supabase.rpc("claim_outbox_sms", { p_limit: Math.min(100, Math.max(1, limit)) });
  if (error) return { configured: true, provider: provider.name, sent: 0, failed: 0, reason: error.message };
  const rows = (data ?? []) as SmsOutboxRow[];
  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    const result = await provider.send({ id: row.id, channel: "sms", toPhone: row.to_phone, body: row.body_text });
    const finished = await supabase.rpc("finish_outbox_sms", {
      p_id: row.id,
      p_ok: result.ok,
      p_provider: result.provider,
      p_message_id: result.messageId ?? null,
      p_error: result.error ?? null,
    });
    if (finished.error) console.error("SMS outbox finish failed", { code: finished.error.code, id: row.id });
    if (result.ok) sent += 1; else failed += 1;
  }
  return { configured: true, provider: provider.name, sent, failed };
}
