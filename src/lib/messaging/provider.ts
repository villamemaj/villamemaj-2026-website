export type GuestMessageChannel = "sms" | "whatsapp";

export interface GuestMessage {
  id: string;
  channel: GuestMessageChannel;
  toPhone: string;
  body: string;
}

export interface GuestMessageSendResult {
  ok: boolean;
  provider: string;
  messageId?: string;
  error?: string;
}

export interface GuestMessageProvider {
  name: string;
  send(message: GuestMessage): Promise<GuestMessageSendResult>;
}

export function configuredGuestChannels(): GuestMessageChannel[] {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!sid || !token) return [];

  const channels: GuestMessageChannel[] = [];
  if (process.env.TWILIO_SMS_FROM?.trim()) channels.push("sms");
  if (process.env.TWILIO_WHATSAPP_FROM?.trim()) channels.push("whatsapp");
  return channels;
}

function normalizePhone(value: string): string | null {
  const valueTrimmed = value.trim().replace(/[\s().-]/g, "");
  return /^\+[1-9]\d{6,14}$/.test(valueTrimmed) ? valueTrimmed : null;
}

const twilioProvider: GuestMessageProvider = {
  name: "twilio",
  async send(message) {
    const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const token = process.env.TWILIO_AUTH_TOKEN?.trim();
    const fromRaw = message.channel === "sms"
      ? process.env.TWILIO_SMS_FROM?.trim()
      : process.env.TWILIO_WHATSAPP_FROM?.trim();

    if (!sid || !token || !fromRaw) {
      return { ok: false, provider: "twilio", error: `Twilio is not configured for ${message.channel}.` };
    }

    const toPhone = normalizePhone(message.toPhone);
    if (!toPhone) {
      return { ok: false, provider: "twilio", error: "Recipient phone must be in E.164 format." };
    }

    const fromPhone = normalizePhone(fromRaw.replace(/^whatsapp:/i, ""));
    if (!fromPhone) {
      return { ok: false, provider: "twilio", error: "Configured sender must be in E.164 format." };
    }

    const form = new URLSearchParams();
    form.set("To", message.channel === "whatsapp" ? `whatsapp:${toPhone}` : toPhone);
    form.set("From", message.channel === "whatsapp" ? `whatsapp:${fromPhone}` : fromPhone);
    form.set("Body", message.body.slice(0, 1500));

    try {
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form,
        cache: "no-store",
      });
      const data = await response.json().catch(() => null) as { sid?: string; message?: string; code?: number } | null;
      if (!response.ok || !data?.sid) {
        return {
          ok: false,
          provider: "twilio",
          error: `Twilio ${response.status}: ${String(data?.message || "message send failed").slice(0, 250)}`,
        };
      }
      return { ok: true, provider: "twilio", messageId: data.sid };
    } catch {
      return { ok: false, provider: "twilio", error: "Could not reach Twilio messaging API." };
    }
  },
};

export function getGuestMessageProvider(): GuestMessageProvider | null {
  return configuredGuestChannels().length ? twilioProvider : null;
}
