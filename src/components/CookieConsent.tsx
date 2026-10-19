"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "villa-memaj-cookie-consent-v1";

type Consent = { necessary: true; analytics: boolean; marketing: boolean; savedAt: string };

export default function CookieConsent({ locale }: { locale: string }) {
  const [visible, setVisible] = useState(false);
  const [preferences, setPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const copy = locale === "el"
    ? { title: "Οι επιλογές απορρήτου σας", body: "Χρησιμοποιούμε μόνο τα απαραίτητα cookies για τη λειτουργία και την ασφάλεια του ιστοτόπου. Προαιρετικά analytics και marketing παραμένουν απενεργοποιημένα εκτός αν επιλέξετε να τα επιτρέψετε.", necessary: "Απαραίτητα (πάντα ενεργά)", analytics: "Analytics", marketing: "Marketing", manage: "Ρυθμίσεις", accept: "Αποδοχή επιλογών", only: "Μόνο απαραίτητα", privacy: "Πολιτική απορρήτου" }
    : locale === "fr"
    ? { title: "Vos choix de confidentialité", body: "Seuls les cookies nécessaires au fonctionnement et à la sécurité sont utilisés par défaut. Les outils facultatifs d’analyse et de marketing restent désactivés jusqu’à votre choix.", necessary: "Nécessaires (toujours actifs)", analytics: "Analyse", marketing: "Marketing", manage: "Préférences", accept: "Enregistrer mes choix", only: "Nécessaires uniquement", privacy: "Politique de confidentialité" }
    : locale === "sq"
    ? { title: "Zgjedhjet tuaja të privatësisë", body: "Si parazgjedhje përdorim vetëm cookies të domosdoshme për funksionimin dhe sigurinë. Analitika dhe marketingu opsional mbeten të çaktivizuara derisa t’i lejoni.", necessary: "Të domosdoshme (gjithmonë aktive)", analytics: "Analitikë", marketing: "Marketing", manage: "Preferencat", accept: "Ruaj zgjedhjet", only: "Vetëm të domosdoshmet", privacy: "Politika e privatësisë" }
    : locale === "de"
    ? { title: "Ihre Datenschutzeinstellungen", body: "Standardmäßig verwenden wir nur notwendige Cookies für Betrieb und Sicherheit. Optionale Analyse- und Marketingtechnologien bleiben deaktiviert, bis Sie zustimmen.", necessary: "Notwendig (immer aktiv)", analytics: "Analyse", marketing: "Marketing", manage: "Einstellungen", accept: "Auswahl speichern", only: "Nur notwendige", privacy: "Datenschutzerklärung" }
    : locale === "it"
    ? { title: "Le tue scelte sulla privacy", body: "Per impostazione predefinita usiamo solo cookie necessari al funzionamento e alla sicurezza. Analisi e marketing facoltativi restano disattivati finché non li autorizzi.", necessary: "Necessari (sempre attivi)", analytics: "Analisi", marketing: "Marketing", manage: "Preferenze", accept: "Salva le scelte", only: "Solo necessari", privacy: "Informativa privacy" }
    : { title: "Your privacy choices", body: "We use only necessary cookies for site operation and security by default. Optional analytics and marketing stay off unless you choose to enable them.", necessary: "Necessary (always on)", analytics: "Analytics", marketing: "Marketing", manage: "Preferences", accept: "Save choices", only: "Necessary only", privacy: "Privacy policy" };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const stored = localStorage.getItem(CONSENT_KEY);
        if (!stored) {
          setVisible(true);
        } else {
          const value = JSON.parse(stored) as Consent;
          setAnalytics(value.analytics === true);
          setMarketing(value.marketing === true);
        }
      } catch {
        setVisible(true);
      }
    });

    const openSettings = () => {
      setVisible(true);
      setPreferences(true);
    };
    window.addEventListener("villa-memaj:open-cookie-settings", openSettings);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("villa-memaj:open-cookie-settings", openSettings);
    };
  }, []);

  function save(allowAnalytics: boolean, allowMarketing: boolean) {
    const value: Consent = { necessary: true, analytics: allowAnalytics, marketing: allowMarketing, savedAt: new Date().toISOString() };
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(value)); } catch { /* consent still applies to this page view */ }
    setAnalytics(allowAnalytics);
    setMarketing(allowMarketing);
    setVisible(false);
    setPreferences(false);
  }

  if (!visible) return null;
  return (
    <aside className="cookie-consent-panel" role="dialog" aria-modal="false" aria-labelledby="cookie-consent-title">
      <div className="cookie-consent-copy">
        <p className="section-label">{copy.title}</p>
        <p id="cookie-consent-title" className="cookie-consent-body">{copy.body}</p>
        <a href={"/" + locale + "/privacy"} className="cookie-consent-policy">{copy.privacy} ↗</a>
      </div>
      {preferences ? (
        <div className="cookie-consent-options">
          <label><input type="checkbox" checked disabled /> <span>{copy.necessary}</span></label>
          <label><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} /> <span>{copy.analytics}</span></label>
          <label><input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} /> <span>{copy.marketing}</span></label>
        </div>
      ) : null}
      <div className="cookie-consent-actions">
        <button type="button" onClick={() => save(false, false)} className="cookie-button cookie-button-quiet">{copy.only}</button>
        <button type="button" onClick={() => setPreferences((value) => !value)} className="cookie-button cookie-button-quiet">{preferences ? (locale === "el" ? "Κλείσιμο" : locale === "fr" ? "Fermer" : locale === "sq" ? "Mbyll" : locale === "de" ? "Schließen" : locale === "it" ? "Chiudi" : "Close preferences") : copy.manage}</button>
        <button type="button" onClick={() => save(analytics, marketing)} className="cookie-button cookie-button-primary">{copy.accept}</button>
      </div>
    </aside>
  );
}
