"use client";

import { useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/lib/site";

type ChatEntry = { role: "guest" | "assistant"; text: string };

const COPY: Record<Locale, {
  label: string; title: string; intro: string; name: string; email: string; message: string;
  send: string; sending: string; close: string; privacy: string; error: string; start: string;
}> = {
  en: {
    label: "Chat with us", title: "Villa Memaj support", intro: "Ask us about the property or your stay.",
    name: "Name (optional)", email: "Email (optional)", message: "Your question",
    send: "Send question", sending: "Sending…", close: "Close chat",
    privacy: "Messages are stored in our private support inbox. Do not send payment-card details or passwords.",
    error: "We could not send that message. Please try again or email info@villamemaj.com.",
    start: "Hello! How can we help?",
  },
  el: {
    label: "Συνομιλήστε μαζί μας", title: "Υποστήριξη Villa Memaj", intro: "Ρωτήστε μας για το κατάλυμα ή τη διαμονή σας.",
    name: "Όνομα (προαιρετικό)", email: "Email (προαιρετικό)", message: "Η ερώτησή σας",
    send: "Αποστολή ερώτησης", sending: "Αποστολή…", close: "Κλείσιμο συνομιλίας",
    privacy: "Τα μηνύματα αποθηκεύονται στο ιδιωτικό μας inbox υποστήριξης. Μην στέλνετε στοιχεία κάρτας ή κωδικούς.",
    error: "Δεν ήταν δυνατή η αποστολή. Δοκιμάστε ξανά ή στείλτε email στο info@villamemaj.com.",
    start: "Γεια σας! Πώς μπορούμε να βοηθήσουμε;",
  },
  fr: {
    label: "Discuter avec nous", title: "Assistance Villa Memaj", intro: "Posez une question sur l’hébergement ou votre séjour.",
    name: "Nom (facultatif)", email: "E-mail (facultatif)", message: "Votre question",
    send: "Envoyer", sending: "Envoi…", close: "Fermer la discussion",
    privacy: "Les messages sont conservés dans notre boîte de support privée. N’envoyez pas de données de carte ou de mots de passe.",
    error: "Envoi impossible. Réessayez ou écrivez à info@villamemaj.com.",
    start: "Bonjour ! Comment pouvons-nous vous aider ?",
  },
  sq: {
    label: "Bisedoni me ne", title: "Mbështetja Villa Memaj", intro: "Pyesni për akomodimin ose qëndrimin tuaj.",
    name: "Emri (opsional)", email: "Email (opsional)", message: "Pyetja juaj",
    send: "Dërgo pyetjen", sending: "Duke dërguar…", close: "Mbyll bisedën",
    privacy: "Mesazhet ruhen në kutinë tonë private të mbështetjes. Mos dërgoni të dhëna karte ose fjalëkalime.",
    error: "Mesazhi nuk u dërgua. Provoni përsëri ose shkruani në info@villamemaj.com.",
    start: "Përshëndetje! Si mund t'ju ndihmojmë?",
  },
  de: {
    label: "Chatten Sie mit uns", title: "Villa Memaj Support", intro: "Fragen Sie uns zur Unterkunft oder Ihrem Aufenthalt.",
    name: "Name (optional)", email: "E-Mail (optional)", message: "Ihre Frage",
    send: "Frage senden", sending: "Wird gesendet…", close: "Chat schließen",
    privacy: "Nachrichten werden in unserem privaten Support-Postfach gespeichert. Senden Sie keine Kartendaten oder Passwörter.",
    error: "Nachricht konnte nicht gesendet werden. Versuchen Sie es erneut oder schreiben Sie an info@villamemaj.com.",
    start: "Hallo! Wie können wir Ihnen helfen?",
  },
  it: {
    label: "Chatta con noi", title: "Assistenza Villa Memaj", intro: "Chiedici informazioni sulla struttura o sul soggiorno.",
    name: "Nome (facoltativo)", email: "Email (facoltativa)", message: "La tua domanda",
    send: "Invia domanda", sending: "Invio…", close: "Chiudi chat",
    privacy: "I messaggi vengono conservati nella nostra casella di supporto privata. Non inviare dati della carta o password.",
    error: "Non è stato possibile inviare il messaggio. Riprova o scrivi a info@villamemaj.com.",
    start: "Ciao! Come possiamo aiutarti?",
  },

};

export default function GuestSupportChat({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [error, setError] = useState("");
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const initialGreeting = entries.length === 0;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextMessage = message.trim();
    if (nextMessage.length < 8 || busy) return;
    setBusy(true);
    setError("");
    setEntries((current) => [...current, { role: "guest", text: nextMessage }]);
    setMessage("");
    try {
      const response = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: nextMessage,
          name,
          email,
          locale,
          threadId,
          website: "",
        }),
      });
      const data = await response.json() as { ok?: boolean; reply?: string; reference?: string; threadId?: string; error?: string };
      if (!response.ok || !data.ok || !data.reply) {
        setError(t.error);
        return;
      }
      if (data.threadId) setThreadId(data.threadId);
      setEntries((current) => [...current, {
        role: "assistant",
        text: data.reply + (data.reference ? "\n\nReference: " + data.reference : ""),
      }]);
    } catch {
      setError(t.error);
    } finally {
      setBusy(false);
      window.setTimeout(() => messageRef.current?.focus(), 0);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[80] flex flex-col items-end gap-3">
      {open ? (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby="guest-support-title"
          className="flex w-[min(92vw,390px)] max-h-[min(78vh,650px)] flex-col overflow-hidden rounded-2xl border border-olive/20 bg-white shadow-2xl"
        >
          <header className="flex items-start justify-between gap-3 bg-olive px-5 py-4 text-cream">
            <div>
              <h2 id="guest-support-title" className="font-display text-xl font-semibold">{t.title}</h2>
              <p className="mt-1 text-xs leading-5 text-cream/80">{t.intro}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={t.close} className="rounded-full px-2 text-xl leading-8 hover:bg-white/10">×</button>
          </header>
          <div className="min-h-28 flex-1 space-y-3 overflow-y-auto bg-cream/40 p-4">
            {initialGreeting ? <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-white p-3 text-sm leading-6 text-ink shadow-sm">{t.start}</div> : null}
            {entries.map((entry, index) => (
              <div key={index} className={entry.role === "guest" ? "ml-auto max-w-[92%] rounded-2xl rounded-tr-sm bg-olive px-3 py-2 text-sm leading-6 text-cream" : "max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-white p-3 text-sm leading-6 text-ink shadow-sm"}>
                {entry.text}
              </div>
            ))}
            {busy ? <p role="status" className="text-xs text-ink-soft">{t.sending}</p> : null}
            {error ? <p role="alert" className="rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}</p> : null}
          </div>
          <form onSubmit={submit} className="space-y-2 border-t border-sand-dark p-4">
            {entries.length === 0 ? (
              <div className="grid grid-cols-2 gap-2">
                <input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} autoComplete="name" placeholder={t.name} className="min-w-0 rounded-lg border border-sand-dark px-3 py-2 text-xs text-ink" />
                <input value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} type="email" autoComplete="email" placeholder={t.email} className="min-w-0 rounded-lg border border-sand-dark px-3 py-2 text-xs text-ink" />
              </div>
            ) : null}
            <label className="sr-only" htmlFor="guest-support-message">{t.message}</label>
            <textarea id="guest-support-message" ref={messageRef} value={message} onChange={(event) => setMessage(event.target.value)} minLength={8} maxLength={2000} required rows={3} placeholder={t.message} className="w-full resize-y rounded-xl border border-sand-dark px-3 py-2 text-sm text-ink outline-none focus:border-olive" />
            <p className="text-[10px] leading-4 text-ink-soft">{t.privacy}</p>
            <button type="submit" disabled={busy || message.trim().length < 8} className="w-full rounded-full bg-olive px-4 py-3 text-sm font-semibold text-cream disabled:opacity-50">{busy ? t.sending : t.send}</button>
          </form>
        </section>
      ) : null}
      <button type="button" onClick={() => { setOpen(true); window.setTimeout(() => messageRef.current?.focus(), 0); }} aria-expanded={open} aria-label={t.label} className="flex items-center gap-3 rounded-full bg-olive px-5 py-3.5 text-sm font-semibold text-cream shadow-xl transition hover:bg-olive-dark">
        <span aria-hidden="true">✦</span>
        <span>{t.label}</span>
      </button>
    </div>
  );
}
