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
    analytics: "Στατιστικά", analyticsText: "Προαιρετική μέτρηση επισκεψιμότητας. Δεν ενεργοποιείται κανένα εργαλείο analytics από αυτήν την επιλογή προς το παρόν.",
    marketing: "Marketing", marketingText: "Προαιρετικές διαφημιστικές τεχνολογίες. Δεν ενεργοποιείται εργαλείο marketing από αυτήν την επιλογή προς το παρόν.",
    accept: "Αποδοχή όλων", reject: "Απόρριψη προαιρετικών", save: "Αποθήκευση επιλογών",
    settings: "Ρυθμίσεις cookies", close: "Κλείσιμο", privacy: "Πολιτική απορρήτου", cookies: "Πολιτική cookies",
  },
  en: {
    title: "Your privacy choices",
    body: "We use strictly necessary technologies to operate the website and remember your choice. Optional analytics and marketing technologies remain off until you consent.",
    necessary: "Strictly necessary", necessaryText: "Security, core functionality, booking and storage of your consent choice. These cannot be switched off.",
    analytics: "Analytics", analyticsText: "Optional audience measurement. No analytics tool is currently activated by this preference.",
    marketing: "Marketing", marketingText: "Optional advertising technologies. No marketing tool is currently activated by this preference.",
    accept: "Accept all", reject: "Reject optional", save: "Save choices",
    settings: "Cookie settings", close: "Close", privacy: "Privacy policy", cookies: "Cookie policy",
  },
  fr: {
    title: "Vos choix de confidentialité",
    body: "Nous utilisons les technologies strictement nécessaires au fonctionnement du site et à la mémorisation de votre choix. Les technologies facultatives d’analyse et de marketing restent désactivées jusqu’à votre accord.",
    necessary: "Strictement nécessaires", necessaryText: "Sécurité, fonctionnement essentiel, réservation et mémorisation de votre choix. Elles ne peuvent pas être désactivées.",
    analytics: "Statistiques", analyticsText: "Mesure d’audience facultative. Aucun outil d’analyse n’est actuellement activé par cette préférence.",
    marketing: "Marketing", marketingText: "Technologies publicitaires facultatives. Aucun outil marketing n’est actuellement activé par cette préférence.",
    accept: "Tout accepter", reject: "Refuser les options", save: "Enregistrer les choix",
    settings: "Paramètres des cookies", close: "Fermer", privacy: "Politique de confidentialité", cookies: "Politique des cookies",
  },
  sq: {
    title: "Zgjedhjet tuaja të privatësisë",
    body: "Përdorim teknologjitë rreptësisht të nevojshme për funksionimin e faqes dhe ruajtjen e zgjedhjes suaj. Analitika dhe marketingu opsional mbeten të çaktivizuara derisa të jepni pëlqimin.",
    necessary: "Të domosdoshme", necessaryText: "Siguria, funksionet bazë, rezervimi dhe ruajtja e zgjedhjes së pëlqimit. Nuk mund të çaktivizohen.",
    analytics: "Analitika", analyticsText: "Matje opsionale e vizitave. Aktualisht nuk aktivizohet asnjë mjet analitike nga kjo zgjedhje.",
    marketing: "Marketingu", marketingText: "Teknologji opsionale reklamimi. Aktualisht nuk aktivizohet asnjë mjet marketingu nga kjo zgjedhje.",
    accept: "Prano të gjitha", reject: "Refuzo opsionet", save: "Ruaj zgjedhjet",
    settings: "Cilësimet e cookies", close: "Mbyll", privacy: "Politika e privatësisë", cookies: "Politika e cookies",
  },
  de: {
    title: "Ihre Datenschutzeinstellungen",
    body: "Wir verwenden unbedingt erforderliche Technologien für den Betrieb der Website und zum Speichern Ihrer Auswahl. Optionale Analyse- und Marketingtechnologien bleiben bis zu Ihrer Einwilligung deaktiviert.",
    necessary: "Unbedingt erforderlich", necessaryText: "Sicherheit, Kernfunktionen, Buchung und Speicherung Ihrer Einwilligungsauswahl. Diese Option kann nicht deaktiviert werden.",
    analytics: "Analyse", analyticsText: "Optionale Reichweitenmessung. Derzeit wird durch diese Auswahl kein Analysetool aktiviert.",
    marketing: "Marketing", marketingText: "Optionale Werbetechnologien. Derzeit wird durch diese Auswahl kein Marketingtool aktiviert.",
    accept: "Alle akzeptieren", reject: "Optionale ablehnen", save: "Auswahl speichern",
    settings: "Cookie-Einstellungen", close: "Schließen", privacy: "Datenschutzerklärung", cookies: "Cookie-Richtlinie",
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
    const current = readConsent();
    if (current) {
      setAnalytics(current.analytics);
      setMarketing(current.marketing);
    } else {
      setVisible(true);
    }
    const openSettings = () => {
      const stored = readConsent();
      setAnalytics(stored?.analytics ?? false);
      setMarketing(stored?.marketing ?? false);
      setManage(true);
      setVisible(true);
    };
    window.addEventListener("open-cookie-settings", openSettings);
    return () => window.removeEventListener("open-cookie-settings", openSettings);
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
