export interface EmailMessage {
  id: string;
  to: string;
  toName?: string | null;
  subject: string;
  body: string;
}

export interface SendResult {
  ok: boolean;
  provider: string;
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  name: string;
  send(message: EmailMessage): Promise<SendResult>;
}

const resendProvider = (apiKey: string, from: string): EmailProvider => ({
  name: "resend",
  async send(message) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [message.to],
          subject: message.subject,
          text: message.body,
        }),
      });

      if (!response.ok) {
        const detail = (await response.text()).slice(0, 300);
        return { ok: false, provider: "resend", error: `resend ${response.status}: ${detail}` };
      }

      const data = (await response.json()) as { id?: string };
      return { ok: true, provider: "resend", messageId: data.id };
    } catch (error) {
      return {
        ok: false,
        provider: "resend",
        error: error instanceof Error ? error.message : "network error",
      };
    }
  },
});

export interface ProviderResolution {
  provider: EmailProvider | null;
  configured: boolean;
  reason?: string;
}

/**
 * Adding another transport (Gmail SMTP, Postmark, Brevo…) means implementing EmailProvider
 * and wiring one more branch here - nothing else in the pipeline changes.
 */
export function getEmailProvider(): ProviderResolution {
  const name = (process.env.EMAIL_PROVIDER ?? "").trim().toLowerCase();
  const from = process.env.EMAIL_FROM?.trim();

  if (name === "resend") {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      return { provider: null, configured: false, reason: "RESEND_API_KEY is not set" };
    }
    if (!from) {
      return { provider: null, configured: false, reason: "EMAIL_FROM must be set to a sender address verified with the email provider" };
    }
    return { provider: resendProvider(apiKey, from), configured: true };
  }

  if (name === "log") {
    return { provider: null, configured: false, reason: "Dry-run logging is disabled in the delivery worker to avoid exposing guest data in logs or marking undelivered messages as sent." };
  }

  return {
    provider: null,
    configured: false,
    reason: "EMAIL_PROVIDER is not set (configure EMAIL_PROVIDER=resend with RESEND_API_KEY and a verified EMAIL_FROM sender)",
  };
}
