"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = { role: "guest" | "assistant"; text: string };

const copy = {
  en: { open: "Guest support", title: "How can we help?", intro: "Ask about stays, policies, check-in or your trip to Albania.", placeholder: "Write your question…", send: "Send", team: "Please ask the property team to contact me", email: "Email for a reply (optional)", notice: "For urgent matters, email info@villamemaj.com. Please do not send card details, passwords or identity documents here.", sent: "Your message has been passed to the support assistant.", human: "I’ve flagged this for the property team. They will follow up using the contact details you provided, if any.", error: "Sorry, chat is temporarily unavailable. Please email info@villamemaj.com." },
  el: { open: "Υποστήριξη", title: "Πώς μπορούμε να βοηθήσουμε;", intro: "Ρωτήστε για διαμονή, όρους, άφιξη ή το ταξίδι σας στην Αλβανία.", placeholder: "Γράψτε την ερώτησή σας…", send: "Αποστολή", team: "Θέλω επικοινωνία από την ομάδα του καταλύματος", email: "Email για απάντηση (προαιρετικό)", notice: "Για επείγοντα θέματα, γράψτε στο info@villamemaj.com. Μην στέλνετε στοιχεία κάρτας, κωδικούς ή έγγραφα ταυτότητας.", sent: "Το μήνυμά σας δόθηκε στον βοηθό υποστήριξης.", human: "Έχω ειδοποιήσει την ομάδα του καταλύματος. Θα επικοινωνήσει με τα στοιχεία που δηλώσατε, εφόσον υπάρχουν.", error: "Η συνομιλία δεν είναι προσωρινά διαθέσιμη. Γράψτε στο info@villamemaj.com." },
  fr: { open: "Assistance", title: "Comment pouvons-nous aider ?", intro: "Posez vos questions sur le séjour, les conditions, l’arrivée ou l’Albanie.", placeholder: "Écrivez votre question…", send: "Envoyer", team: "Je souhaite être contacté par l’équipe", email: "E-mail pour une réponse (facultatif)", notice: "Pour une urgence, écrivez à info@villamemaj.com. N’envoyez pas de carte, de mot de passe ni de pièce d’identité.", sent: "Votre message a été transmis à l’assistant.", human: "J’ai signalé votre demande à l’équipe du logement. Elle vous répondra si vous avez fourni un moyen de contact.", error: "Le chat est temporairement indisponible. Écrivez à info@villamemaj.com." },
  sq: { open: "Mbështetje", title: "Si mund t’ju ndihmojmë?", intro: "Pyetni për qëndrimin, politikat, regjistrimin ose udhëtimin në Shqipëri.", placeholder: "Shkruani pyetjen…", send: "Dërgo", team: "Dua të më kontaktojë ekipi i akomodimit", email: "E-mail për përgjigje (opsional)", notice: "Për urgjenca, shkruani info@villamemaj.com. Mos dërgoni të dhëna karte, fjalëkalime ose dokumente identiteti.", sent: "Mesazhi juaj iu dërgua asistentit të mbështetjes.", human: "E kam njoftuar ekipin e akomodimit. Do t’ju kontaktojë nëse keni dhënë të dhëna kontakti.", error: "Biseda nuk është përkohësisht e disponueshme. Shkruani info@villamemaj.com." },
  de: { open: "Gästesupport", title: "Wie können wir helfen?", intro: "Fragen Sie zu Aufenthalt, Richtlinien, Anreise oder Ihrer Reise nach Albanien.", placeholder: "Ihre Frage…", send: "Senden", team: "Bitte lassen Sie mich vom Unterkunftsteam kontaktieren", email: "E-Mail für Rückfragen (optional)", notice: "Bei dringenden Anliegen schreiben Sie an info@villamemaj.com. Senden Sie keine Kartendaten, Passwörter oder Ausweisdokumente.", sent: "Ihre Nachricht wurde an den Support-Assistenten übermittelt.", human: "Ich habe das Unterkunftsteam informiert. Es meldet sich, falls Sie Kontaktdaten angegeben haben.", error: "Der Chat ist vorübergehend nicht verfügbar. Schreiben Sie an info@villamemaj.com." },
  it: { open: "Assistenza", title: "Come possiamo aiutarti?", intro: "Chiedi informazioni su soggiorno, condizioni, arrivo o viaggio in Albania.", placeholder: "Scrivi la tua domanda…", send: "Invia", team: "Vorrei essere contattato dal team della struttura", email: "E-mail per la risposta (facoltativa)", notice: "Per urgenze, scrivi a info@villamemaj.com. Non inviare dati della carta, password o documenti d’identità.", sent: "Il messaggio è stato inoltrato all’assistente.", human: "Ho segnalato la richiesta al team della struttura. Ti contatterà se hai lasciato recapiti.", error: "La chat non è temporaneamente disponibile. Scrivi a info@villamemaj.com." },
} as const;

export default function SupportChat({ locale }: { locale: string }) {
  const language = locale in copy ? locale as keyof typeof copy : "en";
  const t = copy[language];
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [email, setEmail] = useState("");
  const [requestHuman, setRequestHuman] = useState(false);
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const key = "villa-memaj-support-id:" + language;
      const existing = sessionStorage.getItem(key);
      if (existing) setConversationId(existing);
      else {
        const id = crypto.randomUUID();
        sessionStorage.setItem(key, id);
        setConversationId(id);
      }
    } catch {
      setConversationId("");
    }
  }, [language]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setError("");
    setInput("");
    setMessages((current) => [...current, { role: "guest", text }]);
    setBusy(true);
    try {
      const response = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, locale: language, conversationId: conversationId || undefined, requestHuman, contactEmail: requestHuman ? email.trim() || undefined : undefined }),
      });
      const result = await response.json() as { answer?: string; conversationId?: string; needsStaff?: boolean; error?: string; message?: string };
      if (!response.ok || !result.answer) {
        setMessages((current) => [...current, { role: "assistant", text: result.error || t.error }]);
        return;
      }
      if (result.conversationId) {
        setConversationId(result.conversationId);
        try { sessionStorage.setItem("villa-memaj-support-id:" + language, result.conversationId); } catch { /* optional convenience only */ }
      }
      setMessages((current) => [...current, { role: "assistant", text: result.answer + (result.needsStaff ? "\n\n" + t.human : "") }]);
      setRequestHuman(false);
    } catch {
      setMessages((current) => [...current, { role: "assistant", text: t.error }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="support-chat-root">
      {open ? (
        <section className="support-chat-panel" aria-label={t.title}>
          <header className="support-chat-header">
            <div><p className="support-chat-eyebrow">VILLA MEMAJ</p><h2>{t.title}</h2><p>{t.intro}</p></div>
            <button type="button" className="support-chat-close" aria-label="Close chat" onClick={() => setOpen(false)}>×</button>
          </header>
          <div className="support-chat-messages" ref={listRef} aria-live="polite">
            {messages.length === 0 ? <div className="support-chat-welcome">{t.intro}</div> : null}
            {messages.map((message, index) => <div key={index} className={message.role === "guest" ? "support-chat-message guest" : "support-chat-message assistant"}>{message.text}</div>)}
            {busy ? <div className="support-chat-message assistant" role="status">…</div> : null}
          </div>
          {error ? <p role="alert" className="px-4 text-sm text-red-700">{error}</p> : null}
          <form onSubmit={submit} className="support-chat-form">
            <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={2} maxLength={3000} required placeholder={t.placeholder} aria-label={t.placeholder} />
            <details className="support-chat-contact-options">
              <summary>{language === "el" ? "Επικοινωνία με άνθρωπο" : language === "fr" ? "Contacter l’équipe" : language === "sq" ? "Kontakto ekipin" : language === "de" ? "Team kontaktieren" : language === "it" ? "Contatta il team" : "Contact the team"}</summary>
              <label><input type="checkbox" checked={requestHuman} onChange={(event) => setRequestHuman(event.target.checked)} /> {t.team}</label>
              {requestHuman ? <label className="support-chat-email-label">{t.email}<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} autoComplete="email" placeholder="you@example.com" /></label> : null}
            </details>
            <button type="submit" disabled={busy || !input.trim()}>{busy ? "…" : t.send}<span aria-hidden="true">↗</span></button>
            <p className="support-chat-notice">{t.notice}</p>
          </form>
        </section>
      ) : null}
      <button type="button" className="support-chat-launcher" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span aria-hidden="true">{open ? "×" : "✦"}</span>{t.open}
      </button>
    </div>
  );
}
