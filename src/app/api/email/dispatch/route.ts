import { NextResponse } from "next/server";
import { dispatchQueuedEmails } from "@/lib/email/dispatch";
import { dispatchQueuedGuestMessages } from "@/lib/messaging/dispatch";

export const dynamic = "force-dynamic";

/**
 * Drain the notification queue.
 *
 * Protected only by CRON_SECRET in the Authorization header (Vercel Cron supplies it).
 * Query-string secrets are deliberately rejected so credentials do not leak into access logs
 * or browser history. Returns diagnostics when a provider or service key is missing.
 */
function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  if (request.headers.get("authorization") === `Bearer ${secret}`) return true;

  return false;
}

async function handle(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [email, phoneMessages] = await Promise.all([
    dispatchQueuedEmails(50),
    dispatchQueuedGuestMessages(50),
  ]);
  return NextResponse.json({ email, phoneMessages });
}

export const GET = handle;
export const POST = handle;
