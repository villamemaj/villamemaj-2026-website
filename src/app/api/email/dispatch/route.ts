import { NextResponse } from "next/server";
import { dispatchQueuedEmails } from "@/lib/email/dispatch";
import { dispatchQueuedGuestMessages } from "@/lib/messaging/dispatch";

export const dynamic = "force-dynamic";

/**
 * Drain the notification queue.
 *
 * Protected by CRON_SECRET (Vercel Cron sends it as `Authorization: Bearer <secret>`; a
 * manual call may instead pass `?secret=`). Returns diagnostics rather than throwing when
 * the provider or service key is missing, so a misconfigured cron does not error-spam.
 */
function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  if (request.headers.get("authorization") === `Bearer ${secret}`) return true;

  try {
    return new URL(request.url).searchParams.get("secret") === secret;
  } catch {
    return false;
  }
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
