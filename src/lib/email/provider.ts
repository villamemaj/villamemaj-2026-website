import "server-only";
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

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function renderBrandedEmail(body: string): string {
  const safeBody = escapeHtml(body);
  return `<!doctype html>
<html><body style="margin:0;background:#f4f5f1;font-family:Arial,Helvetica,sans-serif;color:#24352b">
  <div style="max-width:640px;margin:24px auto;background:#fff;border:1px solid #e2e6df;border-radius:14px;overflow:hidden">
    <div style="background:#214e3a;padding:22px 28px;color:#fff">
      <div style="font-size:20px;font-weight:700;letter-spacing:.02em">Villa Memaj</div>
      <div style="font-size:12px;opacity:.85;margin-top:5px">Hospitality with care</div>
    </div>
    <div style="padding:26px 28px;line-height:1.7;font-size:14px">
      <pre style="white-space:pre-wrap;overflow-wrap:anywhere;margin:0;font-family:Arial,Helvetica,sans-serif;line-height:1.75">${safeBody}</pre>
    </div>
    <div style="border-top:1px solid #e9ece7;padding:16px 28px;color:#69776c;font-size:12px;line-height:1.6">
      Villa Memaj · Please reply to this email or use the contact details on your reservation.
      <br>Never send full payment-card details by email or chat.
    </div>
  </div>
</body></html>`;
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
          "Idempotency-Key": message.id,
        },
        body: JSON.stringify({
          from,
          to: [message.to],
          subject: message.subject,
          text: message.body,
          html: renderBrandedEmail(message.body),
        }),
        // Resend supports request idempotency, preventing duplicate email delivery after
        // a network timeout when the database worker retries the same outbox row.
      
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
  const from = process.env.EMAIL_FROM?.trim();

  if (name === "resend") {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      return { provider: null, configured: false, reason: "RESEND_API_KEY is not set" };
    }
    if (!from) {
      return { provider: null, configured: false, reason: "EMAIL_FROM is not set to a sender on a verified domain" };
    }
    return { provider: resendProvider(apiKey, from), configured: true };
  }

  if (name === "log") {
    return { provider: logProvider, configured: true };
  }

  return {
    provider: null,
    configured: false,
    reason: "EMAIL_PROVIDER is not set (use EMAIL_PROVIDER=resend with RESEND_API_KEY and EMAIL_FROM on a verified domain, or EMAIL_PROVIDER=log)",
  };
}
