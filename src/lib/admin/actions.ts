"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireStaff, type StaffRole } from "@/lib/admin/auth";
import { dispatchQueuedEmails } from "@/lib/email/dispatch";
import { dispatchQueuedGuestMessages } from "@/lib/messaging/dispatch";

async function dispatchBookingNotifications(bookingId: string): Promise<void> {
  try {
    await Promise.all([
      dispatchQueuedEmails(10, bookingId),
      dispatchQueuedGuestMessages(10, bookingId),
    ]);
  } catch (error) {
    // The durable outboxes and scheduled cron remain the retry path if immediate delivery fails.
    console.error("Immediate booking notification dispatch failed", {
      bookingId,
      error: error instanceof Error ? error.message.slice(0, 200) : "unknown",
    });
  }
}

async function notifyOwnerSlack(message: string): Promise<void> {
  const webhook = process.env.SLACK_WEBHOOK_URL?.trim();
  if (!webhook) return;
  try {
    const url = new URL(webhook);
    if (url.protocol !== "https:" || url.hostname !== "hooks.slack.com") return;
    await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message.slice(0, 1000) }),
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
    });
  } catch {
    // Email outbox remains the durable owner-notification fallback.
  }
}

const BOOKING_ROLES: StaffRole[] = ["owner", "manager", "receptionist"];
const MONEY_ROLES: StaffRole[] = ["owner", "manager", "receptionist", "accountant"];
const RATE_ROLES: StaffRole[] = ["owner", "manager"];

interface PolicySnapshot {
  cancellation_policy?: {
    name?: string;
    free_cancel_before_hours?: number;
    late_cancel_penalty_type?: string;
    late_cancel_penalty_percent?: number;
    non_refundable?: boolean;
  };
  price?: { currency?: string; nights?: number; total?: number };
}

function computeCancellationFee(
  booking: {
    check_in: string;
    total_price: number;
    cancellation_policy_snapshot: PolicySnapshot | null;
  }
): number {
  const snapshot = booking.cancellation_policy_snapshot ?? {};
  const policy = snapshot.cancellation_policy ?? {};
  const total = Number(booking.total_price ?? 0);
  const nights = Number(snapshot.price?.nights ?? 1) || 1;

  if (policy.non_refundable) return total;
  if (!policy.name) return total;

  const freeHours = Number(policy.free_cancel_before_hours ?? 0);
  const deadline = new Date(`${booking.check_in}T14:00:00`);
  deadline.setHours(deadline.getHours() - freeHours);

  if (new Date() < deadline) return 0;

  switch (policy.late_cancel_penalty_type) {
    case "none":
      return 0;
    case "first_night":
      return Math.round((total / nights) * 100) / 100;
    case "percent_of_total":
      return Math.round(total * (Number(policy.late_cancel_penalty_percent ?? 100) / 100) * 100) / 100;
    case "full_stay":
      return total;
    default:
      return total;
  }
}

function revalidateBookingViews(id?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/reservations");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/payments");
  if (id) revalidatePath(`/admin/reservations/${id}`);
}

async function staffActor() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

/* ---------------- Booking lifecycle ---------------- */

export async function confirmBooking(formData: FormData) {
  await requireStaff(BOOKING_ROLES);
  const id = String(formData.get("booking_id") ?? "");
  const { supabase } = await staffActor();

  const { data: confirmed, error: confirmationError } = await supabase
    .from("hotel_bookings")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .in("status", ["request", "hold"])
    .select("id,code,check_in,check_out,total_price,currency_code")
    .maybeSingle();

  if (!confirmationError && confirmed) {
    await Promise.all([
      dispatchBookingNotifications(id),
      notifyOwnerSlack(
        "Villa Memaj booking confirmed: " + (confirmed.code || id)
        + " · " + confirmed.check_in + " to " + confirmed.check_out
        + " · " + confirmed.currency_code + " " + Number(confirmed.total_price || 0).toFixed(2)
        + "\nOpen the CRM reservations workspace to view guest details."
      ),
    ]);
  }

  revalidateBookingViews(id);
}

export async function checkInBooking(formData: FormData) {
  await requireStaff(BOOKING_ROLES);
  const id = String(formData.get("booking_id") ?? "");
  const { supabase } = await staffActor();

  await supabase
    .from("hotel_bookings")
    .update({
      status: "checked_in",
      checked_in_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "confirmed");

  revalidateBookingViews(id);
}

export async function checkOutBooking(formData: FormData) {
  await requireStaff(BOOKING_ROLES);
  const id = String(formData.get("booking_id") ?? "");
  const { supabase } = await staffActor();

  await supabase
    .from("hotel_bookings")
    .update({
      status: "checked_out",
      checked_out_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "checked_in");

  revalidateBookingViews(id);
}

export async function markNoShow(formData: FormData) {
  await requireStaff(BOOKING_ROLES);
  const id = String(formData.get("booking_id") ?? "");
  const { supabase } = await staffActor();

  const { data: booking } = await supabase
    .from("hotel_bookings")
    .select("total_price, cancellation_policy_snapshot")
    .eq("id", id)
    .maybeSingle();

  const snapshot = (booking?.cancellation_policy_snapshot ?? {}) as PolicySnapshot;
  const percent = Number(
    (snapshot.cancellation_policy as { no_show_penalty_percent?: number } | undefined)
      ?.no_show_penalty_percent ?? 100
  );
  const fee = Math.round(Number(booking?.total_price ?? 0) * (percent / 100) * 100) / 100;

  await supabase
    .from("hotel_bookings")
    .update({
      status: "no_show",
      cancellation_fee_charged: fee,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .in("status", ["confirmed", "checked_in"]);

  revalidateBookingViews(id);
}

export async function cancelBooking(formData: FormData) {
  const { userId } = await requireStaff(BOOKING_ROLES);
  const id = String(formData.get("booking_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || "Cancelled by staff";
  const waiveFee = formData.get("waive_fee") === "on";

  const { supabase } = await staffActor();
  const { data: booking } = await supabase
    .from("hotel_bookings")
    .select("total_price, amount_paid, check_in, cancellation_policy_snapshot, currency_code, status")
    .eq("id", id)
    .maybeSingle();

  if (!booking) return;

  const fee = waiveFee ? 0 : computeCancellationFee(booking as never);

  await supabase
    .from("hotel_bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: userId,
      cancellation_reason: reason,
      cancellation_fee_charged: fee,
      expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .not("status", "in", "(checked_out,cancelled)");

  // Refund anything paid above the cancellation fee (tracked, processed manually/bank)
  const paid = Number(booking.amount_paid ?? 0);
  const refundable = Math.round((paid - fee) * 100) / 100;
  if (refundable > 0) {
    await supabase.from("hotel_payment_transactions").insert({
      booking_id: id,
      kind: "refund",
      provider: "manual",
      method: "bank_transfer",
      status: "refund_pending",
      amount: refundable,
      currency_code: booking.currency_code ?? "EUR",
      idempotency_key: `refund-${id}-${Date.now()}`,
      notes: `Refund after cancellation (fee ${fee})`,
      recorded_by: userId,
    });
  }

  revalidateBookingViews(id);
}

export async function updateInternalNotes(formData: FormData) {
  await requireStaff(BOOKING_ROLES);
  const id = String(formData.get("booking_id") ?? "");
  const notes = String(formData.get("internal_notes") ?? "");
  const { supabase } = await staffActor();

  await supabase
    .from("hotel_bookings")
    .update({ internal_notes: notes, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidateBookingViews(id);
}

/* ---------------- Payments ---------------- */

export async function recordPayment(formData: FormData) {
  const { userId } = await requireStaff(MONEY_ROLES);
  const bookingId = String(formData.get("booking_id") ?? "");
  const kind = formData.get("kind") === "refund" ? "refund" : "charge";
  const amount = Number(formData.get("amount") ?? 0);
  const method = String(formData.get("method") ?? "cash");
  const provider = String(formData.get("provider") ?? "manual");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const { supabase } = await staffActor();

  const { data: booking } = await supabase
    .from("hotel_bookings")
    .select("currency_code")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking || !amount || amount <= 0) return;

  await supabase.from("hotel_payment_transactions").insert({
    booking_id: bookingId,
    kind,
    provider: provider === "bkt_vpos" ? "bkt_vpos" : provider === "other" ? "other" : "manual",
    method: ["cash", "card", "bank_transfer", "other"].includes(method) ? method : "other",
    status: kind === "refund" ? "refund_pending" : "succeeded",
    amount,
    currency_code: booking.currency_code ?? "EUR",
    idempotency_key: `${kind}-${bookingId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    notes,
    recorded_by: userId,
    processed_at: new Date().toISOString(),
  });

  revalidateBookingViews(bookingId);
}

export async function markRefundProcessed(formData: FormData) {
  await requireStaff(["owner", "manager", "accountant"]);
  const paymentId = String(formData.get("payment_id") ?? "");
  const { supabase } = await staffActor();

  await supabase
    .from("hotel_payment_transactions")
    .update({ status: "refunded", processed_at: new Date().toISOString() })
    .eq("id", paymentId)
    .eq("kind", "refund");

  revalidateBookingViews();
}

/* ---------------- Rates ---------------- */

export async function saveRoomRates(formData: FormData) {
  await requireStaff(RATE_ROLES);
  const payload = String(formData.get("rates") ?? "[]");
  const { supabase } = await staffActor();

  let rates: { room_id: string; currency_code: string; nightly_rate: number; is_active: boolean }[];
  try {
    rates = JSON.parse(payload);
  } catch {
    return;
  }

  const rows = rates
    .filter(
      (r) =>
        r.room_id &&
        ["EUR", "ALL"].includes(r.currency_code) &&
        Number(r.nightly_rate) > 0
    )
    .map((r) => ({
      room_id: r.room_id,
      currency_code: r.currency_code,
      nightly_rate: Number(r.nightly_rate) || 0,
      is_active: r.is_active !== false,
      updated_at: new Date().toISOString(),
    }));

  if (rows.length) {
    await supabase
      .from("hotel_room_rates")
      .upsert(rows, { onConflict: "room_id,currency_code" });
  }

  revalidatePath("/admin/rooms");
  revalidatePath("/admin");
}

export async function saveRoom(formData: FormData) {
  await requireStaff(RATE_ROLES);
  const id = String(formData.get("room_id") ?? "");
  const { supabase } = await staffActor();

  await supabase
    .from("hotel_rooms")
    .update({
      name_el: String(formData.get("name_el") ?? "").trim(),
      name_en: String(formData.get("name_en") ?? "").trim(),
      description_el: String(formData.get("description_el") ?? "").trim(),
      description_en: String(formData.get("description_en") ?? "").trim(),
      capacity: Number(formData.get("capacity") ?? 2) || 2,
      size_sqm: Number(formData.get("size_sqm") ?? 0) || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/admin/rooms");
}

/* ---------------- Rate plans & policies ---------------- */

export async function saveRatePlan(formData: FormData) {
  await requireStaff(RATE_ROLES);
  const id = String(formData.get("rate_plan_id") ?? "");
  const { supabase } = await staffActor();

  await supabase
    .from("rate_plans")
    .update({
      name_el: String(formData.get("name_el") ?? "").trim(),
      name_en: String(formData.get("name_en") ?? "").trim(),
      description_el: String(formData.get("description_el") ?? "").trim(),
      description_en: String(formData.get("description_en") ?? "").trim(),
      refundable: formData.get("refundable") === "on",
      discount_percent: Number(formData.get("discount_percent") ?? 0) || 0,
      deposit_percent: Number(formData.get("deposit_percent") ?? 0) || 0,
      balance_due: formData.get("balance_due") === "prepaid" ? "prepaid" : "arrival",
      min_stay: Number(formData.get("min_stay") ?? 1) || 1,
      active: formData.get("active") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/admin/rate-plans");
}

export async function savePolicies(formData: FormData) {
  const { userId } = await requireStaff(["owner", "manager"]);
  const { supabase } = await staffActor();

  await supabase
    .from("hotel_house_policies")
    .update({
      check_in_time: String(formData.get("check_in_time") ?? "14:00"),
      check_out_time: String(formData.get("check_out_time") ?? "11:00"),
      quiet_hours: String(formData.get("quiet_hours") ?? ""),
      tax_label: String(formData.get("tax_label") ?? "").trim() || null,
      tax_rate: formData.get("tax_rate") ? Number(formData.get("tax_rate")) : null,
      taxes_included: formData.get("taxes_included") === "on",
      damage_deposit: Number(formData.get("damage_deposit") ?? 0) || 0,
      smoking_allowed: formData.get("smoking_allowed") === "on",
      pets_allowed: formData.get("pets_allowed") === "on",
      children_allowed: formData.get("children_allowed") === "on",
      parties_allowed: formData.get("parties_allowed") === "on",
      house_rules_el: String(formData.get("house_rules_el") ?? ""),
      house_rules_en: String(formData.get("house_rules_en") ?? ""),
      terms_el: String(formData.get("terms_el") ?? ""),
      terms_en: String(formData.get("terms_en") ?? ""),
      privacy_el: String(formData.get("privacy_el") ?? ""),
      privacy_en: String(formData.get("privacy_en") ?? ""),
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("id", "00000000-0000-0000-0000-000000000001");

  revalidatePath("/admin/policies");
  revalidatePath("/[locale]/contact");
  revalidatePath("/[locale]", "layout");
  revalidateTag("contact-info", "max");
}

export async function saveContact(formData: FormData) {
  const { userId } = await requireStaff(["owner", "manager"]);
  const { supabase } = await staffActor();

  const notificationEmails = String(formData.get("notification_emails") ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter((e) => e.length > 0);

  await supabase
    .from("hotel_house_policies")
    .update({
      contact_email: String(formData.get("contact_email") ?? "").trim() || null,
      contact_phone: String(formData.get("contact_phone") ?? "").trim() || null,
      address_el: String(formData.get("address_el") ?? "").trim() || null,
      address_en: String(formData.get("address_en") ?? "").trim() || null,
      notification_emails: notificationEmails.length > 0 ? notificationEmails : [],
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("id", "00000000-0000-0000-0000-000000000001");

  revalidatePath("/admin/policies");
  revalidatePath("/admin/notifications");
  revalidatePath("/[locale]/contact");
  revalidatePath("/[locale]", "layout");
  revalidateTag("contact-info", "max");
}

export async function setCancellationPolicyPublished(formData: FormData) {
  await requireStaff(["owner", "manager"]);
  const id = String(formData.get("policy_id") ?? "");
  const published = formData.get("published") === "true";
  const { supabase } = await staffActor();

  await supabase
    .from("hotel_cancellation_policies")
    .update({ published })
    .eq("id", id);

  revalidatePath("/admin/policies");
}

export async function updateCancellationPolicy(formData: FormData) {
  await requireStaff(["owner", "manager"]);
  const id = String(formData.get("policy_id") ?? "");
  const { supabase } = await staffActor();

  await supabase
    .from("hotel_cancellation_policies")
    .update({
      description: String(formData.get("description") ?? "").trim() || null,
      free_cancel_before_hours: Number(formData.get("free_cancel_before_hours") ?? 0) || 0,
      late_cancel_penalty_type: String(formData.get("late_cancel_penalty_type") ?? "first_night"),
      late_cancel_penalty_percent: Number(formData.get("late_cancel_penalty_percent") ?? 0) || 0,
      no_show_penalty_type: String(formData.get("no_show_penalty_type") ?? "full_stay"),
      no_show_penalty_percent: Number(formData.get("no_show_penalty_percent") ?? 100) || 100,
      non_refundable: formData.get("non_refundable") === "on",
    })
    .eq("id", id);

  revalidatePath("/admin/policies");
}

/* ---------------- Staff accounts ---------------- */

export async function createStaff(formData: FormData) {
  await requireStaff(["owner", "manager"]);
  const { supabase } = await staffActor();

  const { error } = await supabase.rpc("admin_create_staff", {
    p_email: String(formData.get("email") ?? "").trim(),
    p_password: String(formData.get("password") ?? ""),
    p_full_name: String(formData.get("full_name") ?? "").trim(),
    p_role: String(formData.get("role") ?? "receptionist"),
  });

  revalidatePath("/admin/staff");
  redirect(
    error
      ? `/admin/staff?error=${encodeURIComponent(error.message)}`
      : "/admin/staff?ok=created"
  );
}

export async function setStaffRole(formData: FormData) {
  await requireStaff(["owner", "manager"]);
  const { supabase } = await staffActor();

  const { error } = await supabase.rpc("admin_set_staff_role", {
    p_user_id: String(formData.get("user_id") ?? ""),
    p_role: String(formData.get("role") ?? ""),
  });

  revalidatePath("/admin/staff");
  if (error) redirect(`/admin/staff?error=${encodeURIComponent(error.message)}`);
}

export async function setStaffActive(formData: FormData) {
  await requireStaff(["owner", "manager"]);
  const { supabase } = await staffActor();

  const { error } = await supabase.rpc("admin_set_staff_active", {
    p_user_id: String(formData.get("user_id") ?? ""),
    p_active: formData.get("active") === "true",
  });

  revalidatePath("/admin/staff");
  redirect(
    error ? `/admin/staff?error=${encodeURIComponent(error.message)}` : "/admin/staff"
  );
}

/* ---------------- Guests ---------------- */

export async function updateGuestNotes(formData: FormData) {
  await requireStaff(["owner", "manager", "receptionist"]);
  const { supabase } = await staffActor();

  await supabase
    .from("guests")
    .update({
      notes: String(formData.get("notes") ?? "").trim() || null,
      full_name: String(formData.get("full_name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim() || null,
      country: String(formData.get("country") ?? "").trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", String(formData.get("guest_id") ?? ""));

  revalidatePath("/admin/guests");
}

/* ---------------- Inventory blocks ---------------- */

export async function blockDates(formData: FormData) {
  const { userId } = await requireStaff(BOOKING_ROLES);
  const { supabase } = await staffActor();

  await supabase.from("blocked_dates").insert({
    room_id: String(formData.get("room_id") ?? ""),
    start_date: String(formData.get("start_date") ?? ""),
    end_date: String(formData.get("end_date") ?? ""),
    reason: String(formData.get("reason") ?? "other"),
    created_by: userId,
  });

  revalidatePath("/admin/calendar");
  revalidatePath("/admin/rooms");
}

export async function unblockDates(formData: FormData) {
  await requireStaff(BOOKING_ROLES);
  const id = String(formData.get("block_id") ?? "");
  const { supabase } = await staffActor();

  await supabase.from("blocked_dates").delete().eq("id", id);

  revalidatePath("/admin/calendar");
}
