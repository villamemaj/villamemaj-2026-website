"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getSupabase } from "@/lib/supabase";
import type { Dictionary } from "@/lib/i18n";
import type { HotelRoom } from "@/lib/types";

const inputClass =
  "w-full rounded-xl border border-sand-dark bg-white px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-olive focus:ring-2 focus:ring-olive/20";

interface RatePlan {
  id: string;
  code: string;
  name_en: string;
  name_el: string;
  description_en: string;
  description_el: string;
  deposit_percent: number;
  discount_percent: number;
  balance_due: string;
}

interface Quote {
  available: boolean;
  error?: string;
  nights?: number;
  total_price?: number;
  deposit_amount?: number;
  balance_due?: number;
  currency?: string;
}

interface BookingResult {
  code: string;
  status: string;
  total_price: number;
  deposit_amount: number;
  balance_due: number;
  currency: string;
  room_name_en: string;
}

interface BookingFormProps {
  rooms: HotelRoom[];
  dict: Dictionary;
  initialRoomSlug?: string | null;
  locale: string;
}

const STRINGS = {
  el: {
    ratePlan: "Ταρίφα",
    currency: "Νόμισμα",
    adults: "Ενήλικες",
    children: "Παιδιά",
    check: "Έλεγχος διαθεσιμότητας & τιμής",
    checking: "Έλεγχος…",
    review: "Σύνοψη κράτησης",
    nights: "Νύχτες",
    total: "Σύνολο",
    deposit: "Κατάθεση τώρα",
    balanceArrival: "Υπόλοιπο στην άφιξη",
    back: "Πίσω",
    confirm: "Επιβεβαίωση αιτήματος",
    confirming: "Αποστολή…",
    terms: "Αποδέχομαι τους όρους κράτησης και την πολιτική ακύρωσης.",
    notAvailable: "Μη διαθέσιμο για τις επιλεγμένες ημερομηνίες.",
    unavailable: "Το δωμάτιο δεν είναι διαθέσιμο για τις επιλεγμένες ημερομηνίες.",
    priceError: "Δεν ήταν δυνατός ο υπολογισμός τιμής. Δοκιμάστε άλλες ημερομηνίες.",
    holdNote:
      "Η κράτηση κρατείται για 30 λεπτά. Θα επικοινωνήσουμε μαζί σας για την κατάθεση και την επιβεβαίωση.",
    requestNote: "Το αίτημά σας καταχωρήθηκε. Θα το επιβεβαιώσουμε σύντομα.",
    code: "Κωδικός κράτησης",
  },
  en: {
    ratePlan: "Rate plan",
    currency: "Currency",
    adults: "Adults",
    children: "Children",
    check: "Check availability & price",
    checking: "Checking…",
    review: "Booking summary",
    nights: "Nights",
    total: "Total",
    deposit: "Deposit now",
    balanceArrival: "Balance at arrival",
    back: "Back",
    confirm: "Submit booking request",
    confirming: "Sending…",
    terms: "I accept the booking terms and the cancellation policy.",
    notAvailable: "Not available for the selected dates.",
    unavailable: "This room is not available for the selected dates.",
    priceError: "We could not calculate a price. Please try different dates.",
    holdNote:
      "Your dates are held for 30 minutes. We will contact you about the deposit and confirmation.",
    requestNote: "Your request has been recorded. We will confirm shortly.",
    code: "Booking code",
  },
} as const;

export default function BookingForm({ rooms, dict, initialRoomSlug, locale }: BookingFormProps) {
  const t = locale === "en" ? STRINGS.en : STRINGS.el;
  const money = (value: number, currency: string) =>
    new Intl.NumberFormat(currency === "EUR" ? "en-IE" : "sq-AL", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "EUR" ? 2 : 0,
    }).format(value);

  const [ratePlans, setRatePlans] = useState<RatePlan[]>([]);
  const [step, setStep] = useState<"form" | "review" | "success">("form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [draft, setDraft] = useState<Record<string, string | number> | null>(null);

  useEffect(() => {
    getSupabase()
      .from("rate_plans")
      .select(
        "id, code, name_en, name_el, description_en, description_el, deposit_percent, discount_percent, balance_due"
      )
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => setRatePlans((data ?? []) as RatePlan[]));
  }, []);

  async function handleCheck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const fd = new FormData(event.currentTarget);
    const roomSlug = String(fd.get("room_id") ?? "");
    const room = rooms.find((r) => r.slug === roomSlug);
    const checkIn = String(fd.get("check_in") ?? "");
    const checkOut = String(fd.get("check_out") ?? "");
    const adults = Number(fd.get("adults") ?? 1);
    const children = Number(fd.get("children") ?? 0);
    const currency = String(fd.get("currency") ?? "EUR");
    const ratePlanId = String(fd.get("rate_plan_id") ?? "");

    if (!room || !ratePlanId || !checkIn || !checkOut) {
      setError(t.unavailable);
      return;
    }
    if (checkOut <= checkIn) {
      setError(dict.booking.errorText);
      return;
    }

    const payload = {
      room_id: room.id,
      rate_plan_id: ratePlanId,
      check_in: checkIn,
      check_out: checkOut,
      adults,
      children,
      currency,
      guest_name: String(fd.get("guest_name") ?? "").trim(),
      guest_email: String(fd.get("guest_email") ?? "").trim(),
      guest_phone: String(fd.get("guest_phone") ?? "").trim(),
      special_requests: String(fd.get("message") ?? "").trim(),
    };

    setBusy(true);
    const { data, error: rpcError } = await getSupabase().rpc("quote_booking", {
      p_room_id: payload.room_id,
      p_rate_plan_id: payload.rate_plan_id,
      p_check_in: payload.check_in,
      p_check_out: payload.check_out,
      p_currency: payload.currency,
      p_adults: payload.adults,
      p_children: payload.children,
    });
    setBusy(false);

    if (rpcError) {
      setError(t.priceError);
      return;
    }
    const q = (data ?? {}) as Quote;
    if (!q.available) {
      setError(q.error ?? t.notAvailable);
      return;
    }
    setQuote(q);
    setDraft(payload);
    setStep("review");
  }

  async function handleConfirm() {
    if (!draft) return;
    setError("");
    setBusy(true);
    const { data, error: rpcError } = await getSupabase().rpc("create_booking", {
      p_room_id: draft.room_id,
      p_rate_plan_id: draft.rate_plan_id,
      p_check_in: draft.check_in,
      p_check_out: draft.check_out,
      p_adults: draft.adults,
      p_children: draft.children,
      p_guest_name: draft.guest_name,
      p_guest_email: draft.guest_email,
      p_guest_phone: draft.guest_phone || null,
      p_special_requests: draft.special_requests || null,
      p_currency: draft.currency,
      p_accepted_terms: true,
      p_source: "direct",
    });
    setBusy(false);

    if (rpcError) {
      setError(rpcError.message || dict.booking.errorText);
      return;
    }
    setResult(data as BookingResult);
    setStep("success");
  }

  if (step === "success" && result) {
    return (
      <div className="rounded-2xl border border-olive/30 bg-white p-8 text-center">
        <p className="font-display text-2xl font-semibold text-olive">
          {dict.booking.successTitle}
        </p>
        <p className="mt-3 text-sm text-ink-soft">
          {result.status === "hold" ? t.holdNote : t.requestNote}
        </p>
        <div className="mt-6 inline-flex flex-col gap-1 rounded-xl bg-sand/60 px-6 py-4 text-left text-sm">
          <span className="text-ink-soft">
            {t.code}: <strong className="text-ink">{result.code}</strong>
          </span>
          <span className="text-ink-soft">
            {t.total}: <strong className="text-ink">{money(result.total_price, result.currency)}</strong>
          </span>
          {result.deposit_amount > 0 && (
            <span className="text-ink-soft">
              {t.deposit}: <strong className="text-ink">{money(result.deposit_amount, result.currency)}</strong>
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setStep("form");
            setQuote(null);
            setResult(null);
            setDraft(null);
          }}
          className="mt-6 block rounded-full border border-olive/30 px-6 py-2 text-sm font-medium text-olive hover:bg-olive hover:text-cream"
        >
          {dict.booking.newRequest}
        </button>
      </div>
    );
  }

  if (step === "review" && quote && draft) {
    return (
      <div className="space-y-5">
        <h3 className="font-display text-2xl font-semibold text-ink">{t.review}</h3>
        <dl className="divide-y divide-sand-dark rounded-2xl border border-sand-dark bg-white px-5 text-sm">
          <div className="flex items-center justify-between py-3">
            <dt className="text-ink-soft">{dict.booking.roomLabel}</dt>
            <dd className="font-medium text-ink">
              {rooms.find((r) => r.id === draft.room_id)?.name_el} —{" "}
              {rooms.find((r) => r.id === draft.room_id)?.name_en}
            </dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-ink-soft">{dict.booking.checkIn}</dt>
            <dd className="font-medium text-ink">{String(draft.check_in)}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-ink-soft">{dict.booking.checkOut}</dt>
            <dd className="font-medium text-ink">{String(draft.check_out)}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-ink-soft">{t.nights}</dt>
            <dd className="font-medium text-ink">{quote.nights}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-ink-soft">{t.total}</dt>
            <dd className="font-semibold text-ink">{money(quote.total_price ?? 0, quote.currency ?? "EUR")}</dd>
          </div>
          {(quote.deposit_amount ?? 0) > 0 && (
            <>
              <div className="flex items-center justify-between py-3">
                <dt className="text-ink-soft">{t.deposit}</dt>
                <dd className="font-medium text-olive">
                  {money(quote.deposit_amount ?? 0, quote.currency ?? "EUR")}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-ink-soft">{t.balanceArrival}</dt>
                <dd className="font-medium text-ink">
                  {money(quote.balance_due ?? 0, quote.currency ?? "EUR")}
                </dd>
              </div>
            </>
          )}
        </dl>

        <p className="text-xs text-ink-soft">{t.terms}</p>

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setStep("form")}
            className="rounded-full border border-olive/30 px-6 py-3 text-sm font-medium text-olive hover:bg-olive hover:text-cream"
          >
            {t.back}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="rounded-full bg-olive px-8 py-3 text-sm font-semibold text-cream hover:bg-olive-dark disabled:opacity-60"
          >
            {busy ? t.confirming : t.confirm}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleCheck} className="space-y-4">
      <div>
        <label htmlFor="room_id" className="mb-1 block text-sm font-medium text-ink">
          {dict.booking.roomLabel}
        </label>
        <select id="room_id" name="room_id" defaultValue={initialRoomSlug ?? ""} className={inputClass}>
          <option value="">{dict.booking.anyRoom}</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.slug}>
              {room.name_el} — {room.name_en}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="rate_plan_id" className="mb-1 block text-sm font-medium text-ink">
            {t.ratePlan}
          </label>
          <select id="rate_plan_id" name="rate_plan_id" required className={inputClass}>
            {ratePlans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {locale === "en" ? plan.name_en : plan.name_el}
                {plan.deposit_percent > 0 ? ` · ${plan.deposit_percent}%` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="currency" className="mb-1 block text-sm font-medium text-ink">
            {t.currency}
          </label>
          <select id="currency" name="currency" defaultValue="EUR" className={inputClass}>
            <option value="EUR">EUR (€)</option>
            <option value="ALL">ALL (Lek)</option>
          </select>
        </div>
        <div>
          <label htmlFor="guests-display" className="mb-1 block text-sm font-medium text-ink">
            {dict.booking.guests}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              aria-label={t.adults}
              name="adults"
              type="number"
              min={1}
              max={12}
              defaultValue={2}
              className={inputClass}
            />
            <input
              aria-label={t.children}
              name="children"
              type="number"
              min={0}
              max={12}
              defaultValue={0}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="guest_name" className="mb-1 block text-sm font-medium text-ink">
            {dict.booking.name} *
          </label>
          <input id="guest_name" name="guest_name" required maxLength={120} className={inputClass} />
        </div>
        <div>
          <label htmlFor="guest_email" className="mb-1 block text-sm font-medium text-ink">
            {dict.booking.email} *
          </label>
          <input id="guest_email" name="guest_email" type="email" required maxLength={200} className={inputClass} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="guest_phone" className="mb-1 block text-sm font-medium text-ink">
            {dict.booking.phone}
          </label>
          <input id="guest_phone" name="guest_phone" type="tel" maxLength={40} className={inputClass} />
        </div>
        <div>
          <label htmlFor="check_in" className="mb-1 block text-sm font-medium text-ink">
            {dict.booking.checkIn} *
          </label>
          <input id="check_in" name="check_in" type="date" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="check_out" className="mb-1 block text-sm font-medium text-ink">
            {dict.booking.checkOut} *
          </label>
          <input id="check_out" name="check_out" type="date" required className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-medium text-ink">
          {dict.booking.message}
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          maxLength={2000}
          placeholder={dict.booking.messagePlaceholder}
          className={inputClass}
        />
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={busy || ratePlans.length === 0}
        className="w-full rounded-full bg-olive py-3.5 text-sm font-semibold text-cream transition-colors hover:bg-olive-dark disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {busy ? t.checking : t.check}
      </button>
    </form>
  );
}
