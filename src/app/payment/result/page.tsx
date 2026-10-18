import Link from "next/link";

export const metadata = {
  title: "Payment status | Villa Memaj",
  robots: { index: false, follow: false },
};

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const success = status === "success";
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-5 py-16 text-slate-900">
      <section className="w-full max-w-xl rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">Villa Memaj</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{success ? "Thank you for your payment" : "Checkout cancelled"}</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          {success
            ? "Stripe has returned you to the website. Your payment will be confirmed after secure server-side verification. Please keep your booking reference and check your email for confirmation."
            : "No payment was confirmed by this return. If you still want to complete your booking payment, please contact the property or use the secure payment link again."}
        </p>
        <Link href="/el" className="mt-8 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-900">Return to Villa Memaj</Link>
      </section>
    </main>
  );
}
