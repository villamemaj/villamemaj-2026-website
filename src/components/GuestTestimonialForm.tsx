"use client";

import { FormEvent, useState } from "react";

export default function GuestTestimonialForm({ locale }: { locale: string }) {
  const el = locale === "el";
  const labels = {
    name: el ? "Το όνομά σας ή το εμφανιζόμενο όνομα" : "Your name or display name",
    title: el ? "Τίτλος (προαιρετικό)" : "Title (optional)",
    body: el ? "Η εμπειρία σας" : "Your experience",
    rating: el ? "Βαθμολογία" : "Rating",
    consent: el ? "Συμφωνώ να δημοσιευτεί η κριτική μου στον ιστότοπο της Villa Memaj. Κατανοώ ότι μπορώ να ζητήσω την αφαίρεσή της." : "I consent to my review being published on the Villa Memaj website. I understand that I can ask for it to be removed.",
    submit: el ? "Υποβολή κριτικής" : "Submit review",
    reviewNotice: el ? "Οι κριτικές ελέγχονται από την ομάδα πριν δημοσιευτούν. Μην συμπεριλάβετε πληροφορίες κράτησης, στοιχεία επικοινωνίας ή ευαίσθητα προσωπικά δεδομένα." : "Reviews are moderated by the property team before publication. Do not include booking references, contact details or sensitive personal information.",
    thanks: el ? "Ευχαριστούμε! Η κριτική σας υποβλήθηκε για έλεγχο." : "Thank you. Your review has been submitted for moderation.",
    error: el ? "Δεν ήταν δυνατή η υποβολή. Ελέγξτε τα στοιχεία σας και δοκιμάστε ξανά." : "We couldn’t submit that review. Check the fields and try again.",
  };
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState("5");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError(false);
    try {
      const response = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name, title, body, rating: Number(rating), locale, consentToPublish: consent }),
      });
      const result = await response.json() as { error?: string; ok?: boolean };
      if (!response.ok || !result.ok) throw new Error(result.error || labels.error);
      setMessage(labels.thanks);
      setName("");
      setTitle("");
      setBody("");
      setRating("5");
      setConsent(false);
    } catch {
      setError(true);
      setMessage(labels.error);
    } finally {
      setBusy(false);
    }
  }

  const input = "w-full rounded-xl border border-sand-dark bg-white px-4 py-3 text-sm text-ink outline-none focus:border-olive focus:ring-2 focus:ring-olive/20";
  return (
    <form className="guest-testimonial-form" onSubmit={submit}>
      <div className="guest-testimonial-grid">
        <label><span>{labels.name}</span><input className={input} value={name} onChange={(event) => setName(event.target.value)} minLength={1} maxLength={120} required /></label>
        <label><span>{labels.rating}</span><select className={input} value={rating} onChange={(event) => setRating(event.target.value)}>{[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} / 5</option>)}</select></label>
        <label className="guest-testimonial-wide"><span>{labels.title}</span><input className={input} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} /></label>
        <label className="guest-testimonial-wide"><span>{labels.body}</span><textarea className={input} value={body} onChange={(event) => setBody(event.target.value)} rows={5} minLength={10} maxLength={3000} required /></label>
      </div>
      <label className="guest-testimonial-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required /><span>{labels.consent}</span></label>
      <p className="mt-3 text-xs leading-6 text-ink-soft">{labels.reviewNotice}</p>
      {message ? <p role={error ? "alert" : "status"} className={error ? "mt-4 text-sm text-red-700" : "mt-4 text-sm text-olive"}>{message}</p> : null}
      <button type="submit" disabled={busy || !consent} className="button-dark mt-5">{busy ? "…" : labels.submit} <span aria-hidden="true">↗</span></button>
    </form>
  );
}
