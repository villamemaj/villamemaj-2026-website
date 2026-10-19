"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Locale } from "@/lib/site";

type Consent = { version: 1; savedAt: string; necessary: true; analytics: boolean; marketing: boolean };
const STORAGE_KEY = "villa-memaj-cookie-consent-v1";
const CONSENT_LIFETIME = 180 * 24 * 60 * 60 * 1000;

const COPY: Record<Locale, {
  title: string; body: string; necessary: string; necessaryText: string; analytics: string;
  analyticsText: string; marketing: string; marketingText: string; accept: string; reject: string;
  save: string; settings: string; close: string; privacy: string; cookies: string;
}> = {
  el: {
    title: "Οι επιλογές απορρήτου σας",
    body: "Χρησιμοποιούμε τις απολύτως απαραίτητες τεχνολογίες για να λειτουργεί ο ιστότοπος και να θυμόμαστε την επιλογή σας. Τα προαιρετικά αναλυτικά στοιχεία και οι τεχνολογίες marketing είναι απενεργοποιημένα μέχρι να δώσετε συγκατάθεση.",
    necessary: "Απολύτως απαραίτητα", necessaryText: "Ασφάλεια, βασική λειτουργία, κράτηση και αποθήκευση της επιλογής συγκατάθεσης. Δεν απενεργοποιούνται.",
    analytics: "Στατιστικά", analyticsText: "Προαιρετική μέτρηση απόδοσης μέσω Vercel Speed Insights. Ενεργοποιείται μόνο αν επιλέξετε στατιστικά· χωρίς συγκατάθεση παραμένει απενεργοποιημένη.",
    marketing: "Marketing και υπηρεσίες τρίτων", marketingText: "Προαιρετικές τεχνολογίες marketing και ενσωματωμένες υπηρεσίες τρίτων. Η αναζήτηση πτήσεων Skyscanner φορτώνεται μόνο μετά από αυτή την επιλογή και δική σας ενέργεια. Το Skyscanner μπορεί να λάβει τα στοιχεία αναζήτησης και τεχνικά δεδομένα σύνδεσης.",
    accept: "Αποδοχή όλων", reject: "Απόρριψη προαιρετικών", save: "Αποθήκευση επιλογών",
    settings: "Ρυθμίσεις cookies", close: "Κλείσιμο", privacy: "Πολιτική απορρήτου", cookies: "Πολιτική cookies",
  },
  en: {
    title: "Your privacy choices",
    body: "We use strictly necessary technologies to operate the website and remember your choice. Optional analytics and marketing technologies remain off until you consent.",
    necessary: "Strictly necessary", necessaryText: "Security, core functionality, booking and storage of your consent choice. These cannot be switched off.",
    analytics: "Analytics", analyticsText: "Optional performance measurement via Vercel Speed Insights. It runs only when you opt into analytics; it remains off without your consent.",
    marketing: "Marketing & third-party services", marketingText: "Optional advertising and embedded third-party services. The Skyscanner flight search loads only after you enable this category and choose to open it. Skyscanner may receive your flight-search details and technical connection data.",
    accept: "Accept all", reject: "Reject optional", save: "Save choices",
    settings: "Cookie settings", close: "Close", privacy: "Privacy policy", cookies: "Cookie policy",
  },
  fr: {
    title: "Vos choix de confidentialité",
    body: "Nous utilisons les technologies strictement nécessaires au fonctionnement du site et à la mémorisation de votre choix. Les technologies facultatives d’analyse et de marketing restent désactivées jusqu’à votre accord.",
    necessary: "Strictement nécessaires", necessaryText: "Sécurité, fonctionnement essentiel, réservation et mémorisation de votre choix. Elles ne peuvent pas être désactivées.",
    analytics: "Statistiques", analyticsText: "Mesure facultative des performances via Vercel Speed Insights. Elle s’active uniquement si vous acceptez les statistiques ; sans consentement, elle reste désactivée.",
    marketing: "Marketing et services tiers", marketingText: "Technologies publicitaires facultatives et services tiers intégrés. La recherche Skyscanner ne se charge qu’après l’activation de cette catégorie et votre demande. Skyscanner peut recevoir les détails de votre recherche et des données techniques de connexion.",
    accept: "Tout accepter", reject: "Refuser les options", save: "Enregistrer les choix",
    settings: "Paramètres des cookies", close: "Fermer", privacy: "Politique de confidentialité", cookies: "Politique des cookies",
  },
  sq: {
    title: "Zgjedhjet tuaja të privatësisë",
    body: "Përdorim teknologjitë rreptësisht të nevojshme për funksionimin e faqes dhe ruajtjen e zgjedhjes suaj. Analitika dhe marketingu opsional mbeten të çaktivizuara derisa të jepni pëlqimin.",
    necessary: "Të domosdoshme", necessaryText: "Siguria, funksionet bazë, rezervimi dhe ruajtja e zgjedhjes së pëlqimit. Nuk mund të çaktivizohen.",
    analytics: "Analitika", analyticsText: "Matje opsionale e performancës përmes Vercel Speed Insights. Aktivizohet vetëm nëse pranoni analitikën; pa pëlqimin tuaj mbetet e çaktivizuar.",
    marketing: "Marketingu dhe shërbimet e palëve të treta", marketingText: "Teknologji opsionale marketingu dhe shërbime të integruara të palëve të treta. Kërkimi i fluturimeve në Skyscanner ngarkohet vetëm pasi aktivizoni këtë kategori dhe zgjidhni ta hapni. Skyscanner mund të marrë të dhënat e kërkimit dhe të dhëna teknike të lidhjes.",
    accept: "Prano të gjitha", reject: "Refuzo opsionet", save: "Ruaj zgjedhjet",
    settings: "Cilësimet e cookies", close: "Mbyll", privacy: "Politika e privatësisë", cookies: "Politika e cookies",
  },
  de: {
    title: "Ihre Datenschutzeinstellungen",
    body: "Wir verwenden unbedingt erforderliche Technologien für den Betrieb der Website und zum Speichern Ihrer Auswahl. Optionale Analyse- und Marketingtechnologien bleiben bis zu Ihrer Einwilligung deaktiviert.",
    necessary: "Unbedingt erforderlich", necessaryText: "Sicherheit, Kernfunktionen, Buchung und Speicherung Ihrer Einwilligungsauswahl. Diese Option kann nicht deaktiviert werden.",
    analytics: "Analyse", analyticsText: "Optionale Leistungsmessung mit Vercel Speed Insights. Sie wird nur aktiviert, wenn Sie Analyse zustimmen; ohne Einwilligung bleibt sie deaktiviert.",
    marketing: "Marketing und Drittanbieterdienste", marketingText: "Optionale Werbetechnologien und eingebettete Dienste Dritter. Die Skyscanner-Flugsuche wird erst geladen, wenn Sie diese Kategorie aktivieren und die Suche öffnen. Skyscanner kann Flugsuchdetails und technische Verbindungsdaten erhalten.",
    accept: "Alle akzeptieren", reject: "Optionale ablehnen", save: "Auswahl speichern",
    settings: "Cookie-Einstellungen", close: "Schließen", privacy: "Datenschutzerklärung", cookies: "Cookie-Richtlinie",
  },
  it: {
    title: "Le tue scelte sulla privacy",
    body: "Utilizziamo tecnologie strettamente necessarie per far funzionare il sito e ricordare la tua scelta. Le tecnologie facoltative di analisi e marketing restano disattivate finché non acconsenti.",
    necessary: "Strettamente necessari", necessaryText: "Sicurezza, funzionalità essenziali, prenotazioni e memorizzazione della scelta di consenso. Non possono essere disattivati.",
    analytics: "Statistiche", analyticsText: "Misurazione facoltativa delle prestazioni tramite Vercel Speed Insights. Si attiva solo se acconsenti alla categoria analisi; senza consenso resta disattivata.",
    marketing: "Marketing e servizi di terze parti", marketingText: "Tecnologie facoltative di marketing e servizi integrati di terze parti. La ricerca voli Skyscanner viene caricata solo dopo che attivi questa categoria e scegli di aprirla. Skyscanner può ricevere i dati di ricerca e dati tecnici di connessione.",
    accept: "Accetta tutto", reject: "Rifiuta gli opzionali", save: "Salva le preferenze",
    settings: "Impostazioni cookie", close: "Chiudi", privacy: "Informativa sulla privacy", cookies: "Informativa sui cookie",
  },
};

function readConsent(): Consent | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<Consent>;
    if (value.version !== 1 || typeof value.savedAt !== "string" || value.necessary !== true
      || typeof value.analytics !== "boolean" || typeof value.marketing !== "boolean") return null;
    if (Date.now() - new Date(value.savedAt).getTime() > CONSENT_LIFETIME) return null;
    return value as Consent;
  } catch {
    return null;
  }
}

export default function CookieConsent({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const [visible, setVisible] = useState(false);
  const [manage, setManage] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    // Defer browser-storage hydration to the next frame to avoid a synchronous
    // cascading render from the effect. The banner remains hidden until this check.
    const frame = window.requestAnimationFrame(() => {
      const current = readConsent();
      if (current) {
        setAnalytics(current.analytics);
        setMarketing(current.marketing);
      } else {
        setVisible(true);
      }
    });
    const openSettings = () => {
      const stored = readConsent();
      setAnalytics(stored?.analytics ?? false);
      setMarketing(stored?.marketing ?? false);
      setManage(true);
      setVisible(true);
    };
    window.addEventListener("open-cookie-settings", openSettings);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("open-cookie-settings", openSettings);
    };
  }, []);

  const persist = useCallback((allowAnalytics: boolean, allowMarketing: boolean) => {
    const consent: Consent = {
      version: 1, savedAt: new Date().toISOString(), necessary: true,
      analytics: allowAnalytics, marketing: allowMarketing,
    };
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent)); } catch { /* Continue without persistence if storage is unavailable. */ }
    setAnalytics(allowAnalytics);
    setMarketing(allowMarketing);
    setVisible(false);
    setManage(false);
    window.dispatchEvent(new CustomEvent("villa-memaj-cookie-consent-updated", { detail: consent }));
  }, []);

  if (!visible) return null;

  return (
    <div className="cookie-consent-layer" role="region" aria-label={t.title}>
      <section className="cookie-consent-panel" aria-labelledby="cookie-consent-heading">
        <div className="cookie-consent-copy">
          <p className="admin-eyebrow">Villa Memaj · Privacy</p>
          <h2 id="cookie-consent-heading">{t.title}</h2>
          <p>{t.body}</p>
          <p className="cookie-consent-links"><Link href={"/" + locale + "/cookies"}>{t.cookies}</Link><span>·</span><Link href={"/" + locale + "/privacy"}>{t.privacy}</Link></p>
        </div>
        {manage ? (
          <div className="cookie-consent-categories">
            <div className="cookie-consent-category">
              <div><strong>{t.necessary}</strong><p>{t.necessaryText}</p></div>
              <input type="checkbox" checked disabled aria-label={t.necessary} />
            </div>
            <label className="cookie-consent-category">
              <div><strong>{t.analytics}</strong><p>{t.analyticsText}</p></div>
              <input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} />
            </label>
            <label className="cookie-consent-category">
              <div><strong>{t.marketing}</strong><p>{t.marketingText}</p></div>
              <input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} />
            </label>
          </div>
        ) : null}
        <div className="cookie-consent-actions">
          {manage ? (
            <>
              <button type="button" className="cookie-button-secondary" onClick={() => setManage(false)}>{t.close}</button>
              <button type="button" className="cookie-button-secondary" onClick={() => persist(false, false)}>{t.reject}</button>
              <button type="button" className="cookie-button-primary" onClick={() => persist(analytics, marketing)}>{t.save}</button>
            </>
          ) : (
            <>
              <button type="button" className="cookie-button-secondary" onClick={() => persist(false, false)}>{t.reject}</button>
              <button type="button" className="cookie-button-secondary" onClick={() => setManage(true)}>{t.settings}</button>
              <button type="button" className="cookie-button-primary" onClick={() => persist(true, true)}>{t.accept}</button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
