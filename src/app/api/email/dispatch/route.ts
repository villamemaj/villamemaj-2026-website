import { NextResponse } from "next/server";
import { dispatchQueuedEmails } from "@/lib/email/dispatch";
import { dispatchQueuedSms } from "@/lib/notifications/sms";
import { dispatchOwnerNotifications } from "@/lib/notifications/owner";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === "Bearer " + secret;
}

async function handle(request: Request) {
  if (!authorised(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createSupabaseServiceClient();
  let lifecycle: { queued_email_rows?: number; queued_sms_rows?: number; ok?: boolean } | null = null;
  let lifecycleError: string | null = null;
  if (supabase) {
    const { data, error } = await supabase.rpc("queue_guest_lifecycle_messages");
    if (error) lifecycleError = "Lifecycle queue job failed: " + error.code;
    else lifecycle = data as typeof lifecycle;
  } else {
    lifecycleError = "Supabase service role is not configured.";
  }

  const [email, sms, owner] = await Promise.all([
    dispatchQueuedEmails(50),
    dispatchQueuedSms(50),
    dispatchOwnerNotifications(50),
  ]);

  return NextResponse.json({
    ok: !lifecycleError && !email.reason && !sms.reason && !owner.reason,
    lifecycle,
    lifecycleError,
    email,
    sms,
    ownerNotifications: owner,
    note: "Queue status reflects provider responses. A queued message is not proof of delivery to a guest or owner.",
  });
}

export const GET = handle;
export const POST = handle;
