import { NextResponse } from "next/server";
import { dispatchQueuedEmails } from "@/lib/email/dispatch";
import { dispatchQueuedGuestMessages } from "@/lib/messaging/dispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Immediately flushes only the recent, due outbox rows attached to the just-submitted
 * booking. The database claim functions restrict this to that booking and to queue items
 * created in the last 15 minutes; this route can never drain the global notification queue.
 *
 * The booking UUID is opaque; the route returns no guest/contact/message data. If a provider
 * is unconfigured, the durable queue stays pending and the scheduled worker can retry later.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ accepted: false }, { status: 400 });
  }

  const bookingId = (body as { bookingId?: unknown } | null)?.bookingId;
  if (!isUuid(bookingId)) {
    return NextResponse.json({ accepted: false }, { status: 400 });
  }

  const [email, phoneMessages] = await Promise.all([
    dispatchQueuedEmails(10, bookingId),
    dispatchQueuedGuestMessages(10, bookingId),
  ]);

  return NextResponse.json({
    accepted: true,
    emailQueued: !email.configured,
    phoneQueued: !phoneMessages.configured,
  });
}
