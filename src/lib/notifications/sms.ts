import { createSupabaseServiceClient } from "@/lib/supabase/service";

type SmsRow = {
  id: string;
  to_phone: string;
  body_text: string;
};

export type SmsDispatchSummary = {
  configured: boolean;
  reason?: string;
  sent: number;
  failed: number;
};

function configuredTwilio() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_PHONE_NUMBER?.trim();
  return accountSid && authToken && from ? { accountSid, authToken, from } : null;
}

export async function dispatchQueuedSms(limit = 25): Promise<SmsDispatchSummary> {
  const twilio = configuredTwilio();
  if (!twilio) {
    return { configured: false, reason: "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER are not all configured", sent: 0, failed: 0 };
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { configured: false, reason: "SUPABASE_SERVICE_ROLE_KEY is not set", sent: 0, failed: 0 };
  }

  const { data, error } = await supabase.rpc("claim_outbox_sms", { p_limit: Math.max(1, Math.min(limit, 100)) });
  if (error) return { configured: true, reason: "Could not claim SMS outbox rows", sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  const rows = (data ?? []) as SmsRow[];
  const authorization = Buffer.from(twilio.accountSid + ":" + twilio.authToken).toString("base64");

  for (const row of rows) {
    const body = new URLSearchParams();
    body.set("To", row.to_phone);
    body.set("From", twilio.from);
    body.set("Body", row.body_text);
    try {
      const response = await fetch(
        "https://api.twilio.com/2010-04-01/Accounts/" + encodeURIComponent(twilio.accountSid) + "/Messages.json",
        {
          method: "POST",
          headers: { Authorization: "Basic " + authorization, "Content-Type": "application/x-www-form-urlencoded" },
          body,
          cache: "no-store",
        }
      );
      const result = await response.json().catch(() => null) as { sid?: string; message?: string; code?: number } | null;
      const ok = response.ok && Boolean(result?.sid);
      await supabase.rpc("finish_outbox_sms", {
        p_id: row.id,
        p_ok: ok,
        p_provider: "twilio",
        p_message_id: result?.sid ?? null,
        p_error: ok ? null : ("Twilio " + response.status + ": " + String(result?.message ?? "SMS failed").slice(0, 300)),
      });
      if (ok) sent += 1;
      else failed += 1;
    } catch {
      await supabase.rpc("finish_outbox_sms", {
        p_id: row.id,
        p_ok: false,
        p_provider: "twilio",
        p_message_id: null,
        p_error: "Network error calling Twilio",
      });
      failed += 1;
    }
  }

  return { configured: true, sent, failed };
}
