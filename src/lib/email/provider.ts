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

/**
 * Dry-run provider: logs instead of sending. Lets the whole pipeline be exercised and
 * verified, and lets staff see the exact wording, before any provider key exists.
 */
const logProvider: EmailProvider = {
  name: "log",
  async send(message) {
    console.log(
      `[email:log] to=${message.to} subject=${JSON.stringify(message.subject)}\n${message.body}`
    );
    return { ok: true, provider: "log" };
  },
};

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
  const from = process.env.EMAIL_FROM?.trim() || "Villa Memaj <onboarding@resend.dev>";

  if (name === "resend") {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      return { provider: null, configured: false, reason: "RESEND_API_KEY is not set" };
    }
    return { provider: resendProvider(apiKey, from), configured: true };
  }

  if (name === "log") {
    return { provider: logProvider, configured: true };
  }

  return {
    provider: null,
    configured: false,
    reason: "EMAIL_PROVIDER is not set (use EMAIL_PROVIDER=resend with RESEND_API_KEY, or EMAIL_PROVIDER=log)",
  };
}
