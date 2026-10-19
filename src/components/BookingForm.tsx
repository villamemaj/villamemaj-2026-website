"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
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
  booking_id: string;
  code: string;
  status: string;
  total_price: number;
  deposit_amount: number;
  balance_due: number;
  currency: string;
  room_name_en: string;
}

interface IntakeResponse {
  ok?: boolean;
  reason?: "rate_limited" | "rejected" | "invalid";
  message?: string;
  booking?: BookingResult;
}

interface BookingFormProps {
  rooms: HotelRoom[];
  dict: Dictionary;
  initialRoomSlug?: string | null;
  locale: string;
}

const STRINGS = {
  el: {
    ratePlan: "Ταρίφα", currency: "Νόμισμα", adults: "Ενήλικες", children: "Παιδιά",
    check: "Έλεγχος διαθεσιμότητας & τιμής", checking: "Έλεγχος…", review: "Σύνοψη κράτησης", nights: "Νύχτες",
    total: "Σύνολο", deposit: "Κατάθεση τώρα", balanceArrival: "Υπόλοιπο στην άφιξη", back: "Πίσω",
    confirm: "Επιβεβαίωση αιτήματος", confirming: "Αποστολή…", terms: "Έχω διαβάσει και αποδέχομαι τους όρους κράτησης και την πολιτική ακύρωσης.",
    termsLink: "Όροι κράτησης", cancellationLink: "Ακύρωση και επιστροφές", acceptRequired: "Αποδεχτείτε τους όρους κράτησης για να συνεχίσετε.",
    notAvailable: "Μη διαθέσιμο για τις επιλεγμένες ημερομηνίες.", unavailable: "Το δωμάτιο δεν είναι διαθέσιμο για τις επιλεγμένες ημερομηνίες.",
    priceError: "Δεν ήταν δυνατός ο υπολογισμός τιμής. Δοκιμάστε άλλες ημερομηνίες.",
    holdNote: "Η κράτηση κρατείται για 30 λεπτά. Θα επικοινωνήσουμε μαζί σας για την προκαταβολή και την επιβεβαίωση.",
    requestNote: "Το αίτημά σας καταχωρήθηκε. Θα το επιβεβαιώσουμε σύντομα.", code: "Κωδικός κράτησης",
    rateLimited: "Πολλές προσπάθειες σε σύντομο διάστημα. Δοκιμάστε ξανά σε λίγα λεπτά ή επικοινωνήστε μαζί μας.",
    rejected: "Δεν ήταν δυνατή η υποβολή του αιτήματος. Παρακαλούμε δοκιμάστε ξανά.",
  },
  en: {
    ratePlan: "Rate plan", currency: "Currency", adults: "Adults", children: "Children",
    check: "Check availability & price", checking: "Checking…", review: "Booking summary", nights: "Nights",
    total: "Total", deposit: "Deposit now", balanceArrival: "Balance at arrival", back: "Back",
    confirm: "Submit booking request", confirming: "Sending…", terms: "I have read and accept the booking terms and cancellation policy.",
    termsLink: "Booking terms", cancellationLink: "Cancellations & refunds", acceptRequired: "Please accept the booking terms to continue.",
    notAvailable: "Not available for the selected dates.", unavailable: "This room is not available for the selected dates.",
    priceError: "We could not calculate a price. Please try different dates.",
    holdNote: "Your dates are held for 30 minutes. We will contact you about the deposit and confirmation.",
    requestNote: "Your request has been recorded. We will confirm shortly.", code: "Booking code",
    rateLimited: "Too many attempts in a short time. Please try again in a few minutes or contact us directly.",
    rejected: "We could not submit your request. Please try again.",
  },
  fr: {
    ratePlan: "Tarif", currency: "Devise", adults: "Adultes", children: "Enfants",
    check: "Vérifier la disponibilité et le prix", checking: "Vérification…", review: "Résumé de réservation", nights: "Nuits",
    total: "Total", deposit: "Acompte maintenant", balanceArrival: "Solde à l’arrivée", back: "Retour",
    confirm: "Envoyer la demande", confirming: "Envoi…", terms: "J’ai lu et j’accepte les conditions de réservation et d’annulation.",
    termsLink: "Conditions de réservation", cancellationLink: "Annulations et remboursements", acceptRequired: "Veuillez accepter les conditions pour continuer.",
    notAvailable: "Indisponible aux dates choisies.", unavailable: "Cette chambre n’est pas disponible aux dates choisies.",
    priceError: "Impossible de calculer le prix. Essayez d’autres dates.",
    holdNote: "Vos dates sont retenues pendant 30 minutes. Nous vous contacterons pour l’acompte et la confirmation.",
    requestNote: "Votre demande a été enregistrée. Nous vous répondrons rapidement.", code: "Référence de réservation",
    rateLimited: "Trop de tentatives. Réessayez dans quelques minutes ou contactez-nous.", rejected: "Impossible d’envoyer la demande. Veuillez réessayer.",
  },
  sq: {
    ratePlan: "Tarifa", currency: "Monedha", adults: "Të rritur", children: "Fëmijë",
    check: "Kontrollo disponueshmërinë dhe çmimin", checking: "Duke kontrolluar…", review: "Përmbledhja e rezervimit", nights: "Netë",
    total: "Totali", deposit: "Parapagimi tani", balanceArrival: "Pjesa e mbetur në mbërritje", back: "Kthehu",
    confirm: "Dërgo kërkesën", confirming: "Duke dërguar…", terms: "Kam lexuar dhe pranoj kushtet e rezervimit dhe politikën e anulimit.",
    termsLink: "Kushtet e rezervimit", cancellationLink: "Anulimet dhe rimbursimet", acceptRequired: "Pranoni kushtet e rezervimit për të vazhduar.",
    notAvailable: "Nuk ka disponueshmëri për datat e zgjedhura.", unavailable: "Dhoma nuk është e disponueshme në datat e zgjedhura.",
    priceError: "Nuk mund të llogaritet çmimi. Provoni data të tjera.",
    holdNote: "Datat mbahen për 30 minuta. Do t’ju kontaktojmë për parapagimin dhe konfirmimin.",
    requestNote: "Kërkesa u regjistrua. Do t’ju konfirmojmë së shpejti.", code: "Kodi i rezervimit",
    rateLimited: "Shumë tentativa. Provoni sërish pas pak ose na kontaktoni.", rejected: "Kërkesa nuk u dërgua. Ju lutemi provoni sërish.",
  },
  de: {
    ratePlan: "Tarif", currency: "Währung", adults: "Erwachsene", children: "Kinder",
    check: "Verfügbarkeit und Preis prüfen", checking: "Wird geprüft…", review: "Buchungsübersicht", nights: "Nächte",
    total: "Gesamt", deposit: "Anzahlung jetzt", balanceArrival: "Restbetrag bei Anreise", back: "Zurück",
    confirm: "Buchungsanfrage senden", confirming: "Wird gesendet…", terms: "Ich habe die Buchungsbedingungen und Stornierungsregeln gelesen und akzeptiere sie.",
    termsLink: "Buchungsbedingungen", cancellationLink: "Stornierung und Erstattung", acceptRequired: "Bitte akzeptieren Sie die Buchungsbedingungen, um fortzufahren.",
    notAvailable: "Für die ausgewählten Daten nicht verfügbar.", unavailable: "Dieses Zimmer ist für die ausgewählten Daten nicht verfügbar.",
    priceError: "Der Preis konnte nicht berechnet werden. Bitte wählen Sie andere Daten.",
    holdNote: "Die Daten werden 30 Minuten gehalten. Wir kontaktieren Sie wegen Anzahlung und Bestätigung.",
    requestNote: "Ihre Anfrage wurde gespeichert. Wir bestätigen sie in Kürze.", code: "Buchungscode",
    rateLimited: "Zu viele Versuche. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns.", rejected: "Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut.",
  },
  it: {
    ratePlan: "Tariffa", currency: "Valuta", adults: "Adulti", children: "Bambini",
    check: "Verifica disponibilità e prezzo", checking: "Verifica…", review: "Riepilogo prenotazione", nights: "Notti",
    total: "Totale", deposit: "Acconto ora", balanceArrival: "Saldo all’arrivo", back: "Indietro",
    confirm: "Invia richiesta", confirming: "Invio…", terms: "Ho letto e accetto le condizioni di prenotazione e la politica di cancellazione.",
    termsLink: "Termini di prenotazione", cancellationLink: "Cancellazioni e rimborsi", acceptRequired: "Accetta le condizioni per continuare.",
    notAvailable: "Non disponibile per le date selezionate.", unavailable: "La camera non è disponibile per le date selezionate.",
    priceError: "Non è stato possibile calcolare il prezzo. Prova altre date.",
    holdNote: "Le date sono trattenute per 30 minuti. Ti contatteremo per acconto e conferma.",
    requestNote: "La richiesta è stata registrata. Confermeremo a breve.", code: "Codice di prenotazione",
    rateLimited: "Troppi tentativi. Riprova tra qualche minuto o contattaci.", rejected: "Impossibile inviare la richiesta. Riprova.",
  },
} as const;

export default function BookingForm({ rooms, dict, initialRoomSlug, locale }: BookingFormProps) {
  const t = locale in STRINGS ? STRINGS[locale as keyof typeof STRINGS] : STRINGS.en;
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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [draft, setDraft] = useState<Record<string, string | number> | null>(null);
  const startRef = useRef(0);

  useEffect(() => {
    startRef.current = Date.now();
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
      honeypot: String(fd.get("company_website") ?? "").trim(),
      elapsed_ms: Math.max(0, Date.now() - startRef.current),
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
    setAcceptedTerms(false);
    setQuote(q);
    setDraft(payload);
    setStep("review");
  }

  async function handleConfirm() {
    if (!draft) return;
    if (!acceptedTerms) { setError(t.acceptRequired); return; }
    setError("");
    setBusy(true);
    const { data, error: rpcError } = await getSupabase().rpc("submit_booking_request", {
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
      p_accepted_terms: acceptedTerms,
      p_honeypot: draft.honeypot || null,
      p_elapsed_ms: Number(draft.elapsed_ms ?? 0),
    });
    setBusy(false);

    if (rpcError) {
      setError(rpcError.message || dict.booking.errorText);
      return;
    }

    const response = (data ?? {}) as IntakeResponse;
    if (!response.ok || !response.booking) {
      setError(
        response.reason === "rate_limited"
          ? t.rateLimited
          : response.reason === "invalid" && response.message
            ? response.message
            : t.rejected
      );
      return;
    }

    setResult(response.booking);
    setStep("success");

    // The booking trigger has already committed the guest acknowledgement and owner
    // notification to the outbox. Dispatch only this booking's records immediately.
    void fetch("/api/notifications/dispatch-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: response.booking.booking_id,
        bookingCode: response.booking.code,
        guestEmail: String(draft.guest_email || ""),
      }),
    }).catch(() => undefined);
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
            startRef.current = Date.now();
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

        <div className="booking-terms-acceptance"><label><input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} required /><span>{t.terms}</span></label><div><a href={"/" + locale + "/terms"} target="_blank" rel="noreferrer">{t.termsLink}</a><span aria-hidden="true"> · </span><a href={"/" + locale + "/cancellation"} target="_blank" rel="noreferrer">{t.cancellationLink}</a></div></div>

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setStep("form");
              startRef.current = Date.now();
            }}
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

      {/* Bot trap: invisible to guests, irresistible to naive form-filling bots. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company_website">Website</label>
        <input
          id="company_website"
          name="company_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
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
