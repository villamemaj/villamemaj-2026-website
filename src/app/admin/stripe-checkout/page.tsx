import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";
import StripeCheckoutPanel, { type PayableBooking } from "./StripeCheckoutPanel";

export const dynamic = "force-dynamic";

export default async function StripeCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { supabase, role } = await requireStaff(["owner", "manager", "receptionist", "accountant"]);
  const params = await searchParams;
  const { data, error } = await supabase
    .from("hotel_bookings")
    .select("id, code, guest_name, guest_email, check_in, check_out, status, payment_status, payment_mode, payment_due, deposit_amount, balance_due, currency_code")
    .eq("payment_mode", "online")
    .in("status", ["hold", "confirmed"])
    .in("payment_status", ["unpaid", "partially_paid"])
    .gt("balance_due", 0)
    .order("check_in", { ascending: true })
    .limit(100);

  const bookings = (data ?? []) as PayableBooking[];
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-800">Villa Memaj · CRM</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Stripe checkout</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Create a secure, hosted card-payment link for an eligible online booking. The amount is always calculated from the server-side booking record.</p>
        </div>
        <Link href="/admin/payments" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Back to payments</Link>
      </div>

      {params.status === "success" ? (
        <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Stripe returned the guest to the site. The payment is not considered confirmed until the signed Stripe webhook has reconciled it with the CRM.
        </div>
      ) : null}
      {params.status === "cancelled" ? (
        <div role="status" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Checkout was cancelled. The booking remains unpaid until a verified payment is received.</div>
      ) : null}

      {error ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">Could not load online-payable bookings. Please check CRM access and database policies.</div>
      ) : (
        <StripeCheckoutPanel bookings={bookings} role={role} />
      )}
    </main>
  );
}
