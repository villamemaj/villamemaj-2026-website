import { NextResponse } from "next/server";
import { dispatchQueuedEmails } from "@/lib/email/dispatch";
import { dispatchQueuedGuestMessages } from "@/lib/messaging/dispatch";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  return !!secret && request.headers.get("authorization") === "Bearer " + secret;
}

async function handle(request: Request) {
  if (!authorised(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createSupabaseServiceClient();
  let lifecycleQueue: unknown = { ok: false, reason: "service role is not configured" };
  if (supabase) {
    const queued = await supabase.rpc("queue_guest_lifecycle_messages");
    lifecycleQueue = queued.error
      ? { ok: false, reason: "queue_failed", code: queued.error.code }
      : { ok: true, result: queued.data };
  }
  const [email, phoneMessages] = await Promise.all([
    dispatchQueuedEmails(50),
    dispatchQueuedGuestMessages(50),
  ]);
  return NextResponse.json({ lifecycleQueue, email, phoneMessages });
}

export const GET = handle;
export const POST = handle;
