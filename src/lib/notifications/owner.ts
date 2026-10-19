import { createSupabaseServiceClient } from "@/lib/supabase/service";

type OwnerRow = {
  id: string;
  payload: Record<string, unknown>;
};

export type OwnerDispatchSummary = {
  configured: boolean;
  channels?: string[];
  reason?: string;
  sent: number;
  failed: number;
};

function text(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function ownerChannels() {
  const channels: { name: string; send: (row: OwnerRow) => Promise<{ ok: boolean; messageId?: string; error?: string }> }[] = [];
  const slackUrl = process.env.SLACK_WEBHOOK_URL?.trim();
  if (slackUrl) {
    channels.push({
      name: "slack",
      async send(row) {
        try {
          const p = row.payload;
          const message = [
            "*" + text(p.title || "Villa Memaj booking update") + "*",
            "Reference: " + text(p.reference),
            "Status: " + text(p.status),
            "Room: " + text(p.room),
            "Dates: " + text(p.check_in) + " → " + text(p.check_out),
            "Total: " + text(p.currency) + " " + text(p.total),
            "<" + text(p.crm_url || "https://villamemaj-2026-website.vercel.app/admin/reservations") + "|Open CRM reservations>",
          ].join("\n");
          const response = await fetch(slackUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: message }),
            cache: "no-store",
          });
          return response.ok ? { ok: true } : { ok: false, error: "Slack webhook returned " + response.status };
        } catch {
          return { ok: false, error: "Network error calling Slack webhook" };
        }
      },
    });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM?.trim();
  const ownerWhatsAppTo = process.env.OWNER_WHATSAPP_TO?.trim();
  if (accountSid && authToken && whatsappFrom && ownerWhatsAppTo) {
    channels.push({
      name: "whatsapp",
      async send(row) {
        try {
          const p = row.payload;
          const body = new URLSearchParams();
          body.set("To", ownerWhatsAppTo.startsWith("whatsapp:") ? ownerWhatsAppTo : "whatsapp:" + ownerWhatsAppTo);
          body.set("From", whatsappFrom.startsWith("whatsapp:") ? whatsappFrom : "whatsapp:" + whatsappFrom);
          body.set("Body", [
            text(p.title || "Villa Memaj booking update"),
            "Reference: " + text(p.reference),
            "Status: " + text(p.status),
            "Room: " + text(p.room),
            "Dates: " + text(p.check_in) + " → " + text(p.check_out),
            "Total: " + text(p.currency) + " " + text(p.total),
            "CRM: " + text(p.crm_url || "https://villamemaj-2026-website.vercel.app/admin/reservations"),
          ].join("\n"));
          const authorization = Buffer.from(accountSid + ":" + authToken).toString("base64");
          const response = await fetch("https://api.twilio.com/2010-04-01/Accounts/" + encodeURIComponent(accountSid) + "/Messages.json", {
            method: "POST",
            headers: { Authorization: "Basic " + authorization, "Content-Type": "application/x-www-form-urlencoded" },
            body,
            cache: "no-store",
          });
          const result = await response.json().catch(() => null) as { sid?: string; message?: string } | null;
          return response.ok && result?.sid ? { ok: true, messageId: result.sid } : { ok: false, error: "Twilio WhatsApp returned " + response.status + ": " + text(result?.message).slice(0, 200) };
        } catch {
          return { ok: false, error: "Network error calling Twilio WhatsApp" };
        }
      },
    });
  }

  return channels;
}

export async function dispatchOwnerNotifications(limit = 25, bookingId?: string): Promise<OwnerDispatchSummary> {
  const channels = ownerChannels();
  if (!channels.length) {
    return { configured: false, reason: "Configure SLACK_WEBHOOK_URL or the Twilio WhatsApp variables to enable owner alerts.", sent: 0, failed: 0 };
  }
  const supabase = createSupabaseServiceClient();
  if (!supabase) return { configured: false, reason: "SUPABASE_SERVICE_ROLE_KEY is not set", sent: 0, failed: 0 };

  const safeLimit = Math.max(1, Math.min(limit, 100));
  const { data, error } = bookingId
    ? await supabase.rpc("claim_booking_owner_notifications", { p_booking_id: bookingId, p_limit: safeLimit })
    : await supabase.rpc("claim_owner_notifications", { p_limit: safeLimit });
  if (error) return { configured: true, channels: channels.map((c) => c.name), reason: "Could not claim owner notifications", sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  for (const row of (data ?? []) as OwnerRow[]) {
    // Treat this outbox event as delivered only if every configured channel returns success.
    // Multiple channels can retry an already delivered channel; see the per-channel audit caveat.
    const results = await Promise.all(channels.map((channel) => channel.send(row)));
    const ok = results.every((result) => result.ok);
    const firstFailure = results.find((result) => !result.ok);
    await supabase.rpc("finish_owner_notification", {
      p_id: row.id,
      p_ok: ok,
      p_provider: channels.map((channel) => channel.name).join("+"),
      p_message_id: results.map((result) => result.messageId).filter(Boolean).join(",") || null,
      p_error: firstFailure?.error ?? null,
    });
    if (ok) sent += 1;
    else failed += 1;
  }
  return { configured: true, channels: channels.map((c) => c.name), sent, failed };
}
