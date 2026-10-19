"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@/lib/site";

type Copy = {
  title: string; intro: string; name: string; rating: string; reviewTitle: string; review: string;
  submit: string; sending: string; invalid: string; success: string; failed: string; privacy: string;
  stars: (n: number) => string;
};

const COPY: Record<Locale, Copy> = {
  en: {
    title: "Share your stay", intro: "Thank you for staying with Villa Memaj. Your review will be checked by our team before it appears on the website.",
    name: "Display name (optional)", rating: "Your rating", reviewTitle: "Review title", review: "Your experience",
    submit: "Submit review", sending: "Submitting…", invalid: "This review link is invalid or has expired, or a review has already been submitted.",
    success: "Thank you. Your review has been received and is awaiting moderation.",
    failed: "We could not submit your review. Please try again or contact us.", privacy: "Please do not include booking references, addresses, phone numbers or other private information in the public review.",
    stars: (n) => n === 1 ? "1 star" : n + " stars",
  },
  el: {
    title: "Μοιραστείτε την εμπειρία σας", intro: "Σας ευχαριστούμε που μείνατε στη Villa Memaj. Η αξιολόγηση θα ελεγχθεί πριν εμφανιστεί στον ιστότοπο.",
    name: "Όνομα εμφάνισης (προαιρετικό)", rating: "Η βαθμολογία σας", reviewTitle: "Τίτλος αξιολόγησης", review: "Η εμπειρία σας",
    submit: "Υποβολή αξιολόγησης", sending: "Υποβολή…", invalid: "Ο σύνδεσμος δεν είναι έγκυρος ή έχει λήξει, ή έχει ήδη υποβληθεί αξιολόγηση.",
    success: "Ευχαριστούμε. Η αξιολόγηση καταχωρήθηκε και αναμένει έλεγχο.",
    failed: "Δεν ήταν δυνατή η υποβολή. Δοκιμάστε ξανά ή επικοινωνήστε μαζί μας.", privacy: "Μην συμπεριλάβετε κωδικούς κράτησης, διευθύνσεις, τηλέφωνα ή άλλα ιδιωτικά στοιχεία στη δημόσια αξιολόγηση.",
    stars: (n) => n === 1 ? "1 αστέρι" : n + " αστέρια",
  },
  fr: {
    title: "Partagez votre séjour", intro: "Merci d’avoir séjourné à la Villa Memaj. Notre équipe vérifiera votre avis avant sa publication sur le site.",
    name: "Nom affiché (facultatif)", rating: "Votre note", reviewTitle: "Titre de l’avis", review: "Votre expérience",
    submit: "Envoyer l’avis", sending: "Envoi…", invalid: "Ce lien est invalide ou expiré, ou un avis a déjà été envoyé.",
    success: "Merci. Votre avis a été reçu et attend la modération.",
    failed: "Impossible d’envoyer votre avis. Réessayez ou contactez-nous.", privacy: "N’incluez pas de référence de réservation, d’adresse, de numéro de téléphone ni d’autre information privée.",
    stars: (n) => n === 1 ? "1 étoile" : n + " étoiles",
  },
  sq: {
    title: "Ndani përvojën tuaj", intro: "Faleminderit që qëndruat në Villa Memaj. Ekipi ynë do ta kontrollojë vlerësimin para publikimit në faqe.",
    name: "Emri i shfaqur (opsional)", rating: "Vlerësimi juaj", reviewTitle: "Titulli i vlerësimit", review: "Përvoja juaj",
    submit: "Dërgo vlerësimin", sending: "Duke dërguar…", invalid: "Lidhja është e pavlefshme ose ka skaduar, ose është dorëzuar një vlerësim.",
    success: "Faleminderit. Vlerësimi u mor dhe pret moderimin.",
    failed: "Vlerësimi nuk u dërgua. Provoni përsëri ose na kontaktoni.", privacy: "Mos përfshini kod rezervimi, adresë, numër telefoni ose informacione të tjera private.",
    stars: (n) => n === 1 ? "1 yll" : n + " yje",
  },
  de: {
    title: "Teilen Sie Ihren Aufenthalt", intro: "Vielen Dank für Ihren Aufenthalt in der Villa Memaj. Unser Team prüft Ihre Bewertung, bevor sie auf der Website erscheint.",
    name: "Anzeigename (optional)", rating: "Ihre Bewertung", reviewTitle: "Titel der Bewertung", review: "Ihre Erfahrung",
    submit: "Bewertung senden", sending: "Wird gesendet…", invalid: "Dieser Link ist ungültig oder abgelaufen, oder es wurde bereits eine Bewertung abgegeben.",
    success: "Vielen Dank. Ihre Bewertung ist eingegangen und wartet auf die Moderation.",
    failed: "Ihre Bewertung konnte nicht gesendet werden. Versuchen Sie es erneut oder kontaktieren Sie uns.", privacy: "Bitte keine Buchungsreferenzen, Adressen, Telefonnummern oder andere private Informationen veröffentlichen.",
    stars: (n) => n === 1 ? "1 Stern" : n + " Sterne",
  },
};

export default function GuestReviewForm({ locale, token }: { locale: Locale; token: string }) {
  const t = COPY[locale];
  const [rating, setRating] = useState(5);
  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [review, setReview] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [consentToPublish, setConsentToPublish] = useState(false);
  const [doneMessage, setDoneMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || busy || done) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, displayName, rating, title, review, locale, consentToPublish }),
      });
      const data = await response.json() as { ok?: boolean; message?: string; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error === "invalid_or_expired_link" || data.error === "already_submitted" ? t.invalid : t.failed);
        return;
      }
      setDoneMessage(data.message || (consentToPublish ? t.success : t.privateFeedback));
      setDone(true);
    } catch {
      setError(t.failed);
    } finally {
      setBusy(false);
    }
  }

  if (!token) return <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{t.invalid}</p>;
  if (done) return <div role="status" className="mt-4 rounded-xl border border-olive/20 bg-cream p-5 text-sm leading-7 text-olive">{doneMessage || t.success}</div>;

  return (
    <form onSubmit={submit} className="guest-review-form">
      <p className="mb-5 text-sm leading-7 text-ink-soft">{t.intro}</p>
      <label className="admin-policy-field">
        <span>{t.name}</span>
        <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={60} placeholder={locale === "el" ? "π.χ. Μαρία" : "e.g. Maria"} />
      </label>
      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-semibold text-ink">{t.rating}</legend>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} aria-pressed={rating === n} aria-label={t.stars(n)} className={"rounded-xl border px-4 py-3 text-lg transition " + (rating === n ? "border-olive bg-olive text-cream" : "border-sand-dark bg-white text-olive")}>
              {rating >= n ? "★" : "☆"}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-soft">{t.stars(rating)}</p>
      </fieldset>
      <label className="admin-policy-field mt-5">
        <span>{t.reviewTitle}</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} required minLength={4} maxLength={120} />
      </label>
      <label className="admin-policy-field mt-5">
        <span>{t.review}</span>
        <textarea value={review} onChange={(event) => setReview(event.target.value)} required minLength={20} maxLength={3000} rows={6} />
      </label>
      <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-ink-soft">
        <input type="checkbox" checked={consentToPublish} onChange={(event) => setConsentToPublish(event.target.checked)} className="mt-1 h-4 w-4 accent-olive" />
        <span>{t.consent} {t.privateFeedback}</span>
      </label>
      <p className="mt-3 text-xs leading-6 text-ink-soft">{t.privacy}</p>
      {error ? <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <button type="submit" disabled={busy} className="mt-6 rounded-full bg-olive px-7 py-3 text-sm font-semibold text-cream disabled:opacity-60">{busy ? t.sending : t.submit}</button>
    </form>
  );
}
