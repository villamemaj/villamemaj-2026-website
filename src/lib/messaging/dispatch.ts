import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  configuredGuestChannels,
  getGuestMessageProvider,
  type GuestMessageChannel,
} from "./provider";

interface MessageOutboxRow {
  id: string;
  booking_id: string;
  kind: string;
  channel: GuestMessageChannel;
  to_phone: string;
  body_text: string;
}

export interface GuestMessageDispatchSummary {
  configured: boolean;
  reason?: string;
  provider?: string;
  channels?: GuestMessageChannel[];
  sent: number;
  failed: number;
}

export async function dispatchQueuedGuestMessages(limit = 25, bookingId?: string): Promise<GuestMessageDispatchSummary> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { configured: false, reason: "SUPABASE_SERVICE_ROLE_KEY is not set", sent: 0, failed: 0 };
  }

  const channels = configuredGuestChannels();
  const provider = getGuestMessageProvider();
  if (channels.length === 0 || !provider) {
    return {
      configured: false,
      reason: "Twilio phone messaging is not configured. Add the account SID/token and an opted-in channel sender.",
      sent: 0,
      failed: 0,
    };
  }

  const { data, error } = bookingId
    ? await supabase.rpc("claim_guest_messages_for_booking_configured", {
        p_booking_id: bookingId,
        p_limit: limit,
        p_channels: channels,
      })
    : await supabase.rpc("claim_guest_messages_configured", {
        p_limit: limit,
        p_channels: channels,
      });

  if (error) {
    return { configured: true, provider: provider.name, channels, sent: 0, failed: 0, reason: error.message };
  }

  const rows = (data ?? []) as MessageOutboxRow[];
  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    const result = await provider.send({
      id: row.id,
      channel: row.channel,
      toPhone: row.to_phone,
      body: row.body_text,
    });

    await supabase.rpc("finish_guest_message", {
      p_id: row.id,
      p_ok: result.ok,
      p_provider: result.provider,
      p_message_id: result.messageId ?? null,
      p_error: result.error ?? null,
    });

    if (result.ok) sent += 1;
    else failed += 1;
  }

  return { configured: true, provider: provider.name, channels, sent, failed };
}
