"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/site";

const COPY: Record<Locale, {
  title: string; open: string; loading: string; privacy: string; disclaimer: string; fallback: string; consentNeeded: string; loadError: string;
}> = {
  en: {
    title: "Find a flight that fits your journey",
    open: "Open flight search",
    loading: "Preparing Skyscanner flight search…",
    privacy: "Skyscanner privacy policy",
    disclaimer: "Flight search is supplied by Skyscanner. Searches, results, prices, airline rules and ticket purchases are handled by Skyscanner and its travel partners, not by Villa Memaj.",
    fallback: "The embedded search loads only after you opt in to optional third-party services. If you prefer, open Skyscanner directly.",
    consentNeeded: "Please enable optional marketing / third-party services in Cookie settings to load the embedded search. You can still use the direct Skyscanner link below.",
    loadError: "The embedded search could not be loaded. Please use the direct Skyscanner link below.",
  },
  el: {
    title: "Βρείτε πτήση που ταιριάζει στο ταξίδι σας",
    open: "Άνοιγμα αναζήτησης πτήσεων",
    loading: "Φόρτωση αναζήτησης Skyscanner…",
    privacy: "Πολιτική απορρήτου Skyscanner",
    disclaimer: "Η αναζήτηση πτήσεων παρέχεται από το Skyscanner. Οι αναζητήσεις, τα αποτελέσματα, οι τιμές, οι κανόνες αεροπορικών εταιρειών και οι αγορές εισιτηρίων διεκπεραιώνονται από το Skyscanner και τους συνεργάτες του, όχι από τη Villa Memaj.",
    fallback: "Η ενσωματωμένη αναζήτηση φορτώνεται μόνο μετά τη συγκατάθεση για προαιρετικές υπηρεσίες τρίτων. Μπορείτε επίσης να ανοίξετε απευθείας το Skyscanner.",
    consentNeeded: "Ενεργοποιήστε τις προαιρετικές υπηρεσίες marketing/τρίτων στις Ρυθμίσεις cookies για να φορτωθεί η αναζήτηση. Μπορείτε πάντα να χρησιμοποιήσετε τον απευθείας σύνδεσμο Skyscanner παρακάτω.",
    loadError: "Δεν ήταν δυνατή η φόρτωση της αναζήτησης. Χρησιμοποιήστε τον απευθείας σύνδεσμο Skyscanner παρακάτω.",
  },
  fr: {
    title: "Trouvez le vol adapté à votre voyage",
    open: "Ouvrir la recherche de vols",
    loading: "Préparation de la recherche Skyscanner…",
    privacy: "Politique de confidentialité de Skyscanner",
    disclaimer: "La recherche de vols est fournie par Skyscanner. Les recherches, résultats, prix, règles des compagnies et achats de billets relèvent de Skyscanner et de ses partenaires, et non de Villa Memaj.",
    fallback: "La recherche intégrée ne se charge qu’après votre accord pour les services tiers facultatifs. Vous pouvez aussi ouvrir directement Skyscanner.",
    consentNeeded: "Activez les services facultatifs de marketing / tiers dans les paramètres des cookies pour charger la recherche intégrée. Vous pouvez toujours utiliser le lien direct Skyscanner ci-dessous.",
    loadError: "La recherche intégrée n’a pas pu être chargée. Utilisez le lien direct Skyscanner ci-dessous.",
  },
  sq: {
    title: "Gjeni fluturimin e duhur për udhëtimin tuaj",
    open: "Hap kërkimin e fluturimeve",
    loading: "Po përgatitet kërkimi në Skyscanner…",
    privacy: "Politika e privatësisë e Skyscanner",
    disclaimer: "Kërkimi i fluturimeve ofrohet nga Skyscanner. Kërkimet, rezultatet, çmimet, rregullat e kompanive ajrore dhe blerja e biletave trajtohen nga Skyscanner dhe partnerët e tij, jo nga Villa Memaj.",
    fallback: "Kërkimi i integruar ngarkohet vetëm pasi të pranoni shërbimet opsionale të palëve të treta. Mund të hapni edhe drejtpërdrejt Skyscanner.",
    consentNeeded: "Aktivizoni shërbimet opsionale të marketingut / palëve të treta te Cilësimet e cookies për të ngarkuar kërkimin e integruar. Mund të përdorni gjithmonë lidhjen direkte të Skyscanner më poshtë.",
    loadError: "Kërkimi i integruar nuk u ngarkua. Përdorni lidhjen direkte të Skyscanner më poshtë.",
  },
  de: {
    title: "Finden Sie den passenden Flug für Ihre Reise",
    open: "Flugsuche öffnen",
    loading: "Skyscanner-Flugsuche wird vorbereitet…",
    privacy: "Datenschutzerklärung von Skyscanner",
    disclaimer: "Die Flugsuche wird von Skyscanner bereitgestellt. Suchen, Ergebnisse, Preise, Airline-Regeln und Ticketkäufe werden von Skyscanner und dessen Reisepartnern abgewickelt, nicht von Villa Memaj.",
    fallback: "Die eingebettete Suche wird erst nach Ihrer Zustimmung zu optionalen Drittanbieterdiensten geladen. Sie können Skyscanner auch direkt öffnen.",
    consentNeeded: "Aktivieren Sie optionale Marketing-/Drittanbieterdienste in den Cookie-Einstellungen, um die eingebettete Suche zu laden. Sie können jederzeit den direkten Skyscanner-Link unten nutzen.",
    loadError: "Die eingebettete Suche konnte nicht geladen werden. Verwenden Sie bitte den direkten Skyscanner-Link unten.",
  },
};

function widgetLocale(locale: Locale): string {
  // Skyscanner currently documents Greek, French and German widget locales, but not Albanian.
  // Albanian visitors receive the English widget while the surrounding website remains Albanian.
  switch (locale) {
    case "el": return "el-GR";
    case "fr": return "fr-FR";
    case "de": return "de-DE";
    case "sq": return "en-GB";
    default: return "en-GB";
  }
}

const CONSENT_STORAGE_KEY = "villa-memaj-cookie-consent-v1";
const CONSENT_LIFETIME = 180 * 24 * 60 * 60 * 1000;
const WIDGET_SCRIPT_URL = "https://widgets.skyscanner.net/widget-server/v2.0/widgets-constructor.js";

function hasOptionalThirdPartyConsent(): boolean {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return false;
    const value = JSON.parse(raw) as { version?: number; savedAt?: string; necessary?: boolean; marketing?: boolean };
    const savedAt = value.savedAt ? Date.parse(value.savedAt) : Number.NaN;
    return value.version === 1
      && value.necessary === true
      && value.marketing === true
      && Number.isFinite(savedAt)
      && savedAt <= Date.now()
      && Date.now() - savedAt <= CONSENT_LIFETIME;
  } catch {
    return false;
  }
}

export default function SkyscannerFlightSearch({ locale }: { locale: Locale }) {
  const [activated, setActivated] = useState(false);
  const [needsConsent, setNeedsConsent] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const pendingActivation = useRef(false);
  const t = COPY[locale];

  useEffect(() => {
    const onConsentUpdated = (event: Event) => {
      const consent = (event as CustomEvent<{ marketing?: boolean }>).detail;
      if (pendingActivation.current) {
        if (consent?.marketing === true) {
          pendingActivation.current = false;
          setNeedsConsent(false);
          setLoaded(false);
          setLoadError(false);
          setActivated(true);
        } else if (consent?.marketing === false) {
          pendingActivation.current = false;
          setNeedsConsent(false);
        }
      }
      if (consent?.marketing === false) {
        setActivated(false);
        setLoaded(false);
        setLoadError(false);
      }
    };
    window.addEventListener("villa-memaj-cookie-consent-updated", onConsentUpdated);
    return () => window.removeEventListener("villa-memaj-cookie-consent-updated", onConsentUpdated);
  }, []);

  useEffect(() => {
    if (!activated) return;
    const host = widgetRef.current;
    if (!host) return;

    let disposed = false;
    const script = document.createElement("script");
    script.src = WIDGET_SCRIPT_URL;
    script.async = true;
    script.dataset.villaMemajSkyscanner = "true";
    script.onload = () => {
      if (!disposed) {
        setLoaded(true);
        setLoadError(false);
      }
    };
    script.onerror = () => {
      if (!disposed) {
        setLoaded(false);
        setLoadError(true);
      }
    };
    document.body.appendChild(script);

    return () => {
      disposed = true;
      script.remove();
      // Remove any third-party-created frame/content when the component unmounts
      // or optional consent is withdrawn.
      host.replaceChildren();
    };
  }, [activated]);

  function activateSearch() {
    setLoadError(false);
    setLoaded(false);
    if (hasOptionalThirdPartyConsent()) {
      setNeedsConsent(false);
      setActivated(true);
      return;
    }
    pendingActivation.current = true;
    setNeedsConsent(true);
    window.dispatchEvent(new Event("open-cookie-settings"));
  }

  return (
    <section className="travel-flight-widget" aria-labelledby="travel-flight-search-title">
      <div className="travel-flight-widget-heading">
        <span className="travel-flight-kicker">Skyscanner</span>
        <h2 id="travel-flight-search-title" className="font-display">{t.title}</h2>
        <p>{t.disclaimer}</p>
      </div>
      {!activated ? (
        <div className="travel-flight-activate">
          <p>{t.fallback}</p>
          {needsConsent ? <p className="travel-flight-consent-note" role="status">{t.consentNeeded}</p> : null}
          <button type="button" onClick={activateSearch} className="button-dark">
            {t.open} <span aria-hidden="true">↗</span>
          </button>
        </div>
      ) : (
        <div className="travel-flight-frame" aria-live="polite">
          {!loaded && !loadError ? <div className="travel-flight-loading" role="status">{t.loading}</div> : null}
          {loadError ? <p className="travel-flight-consent-note" role="alert">{t.loadError}</p> : null}
          <div
            ref={widgetRef}
            data-skyscanner-widget="SearchWidget"
            data-locale={widgetLocale(locale)}
            data-flight-type="return"
            data-target="_blank"
            data-colour="transparent"
            data-button-label={t.open}
            data-widget-border-radius="12"
            data-widget-padding="12px"
            data-web-only-redirects="true"
            data-enable-placeholders="true"
            data-responsive="true"
            data-widget-scale="1"
            data-associate-id={process.env.NEXT_PUBLIC_SKYSCANNER_ASSOCIATE_ID || undefined}
            data-utm-term="villa-memaj-website"
          />
        </div>
      )}
      <div className="travel-flight-footnote">
        <a href="https://www.skyscanner.net/" target="_blank" rel="noopener noreferrer sponsored">
          Skyscanner <span aria-hidden="true">↗</span>
        </a>
        <span aria-hidden="true">·</span>
        <a href="https://www.skyscanner.net/privacy-policy" target="_blank" rel="noopener noreferrer">
          {t.privacy}
        </a>
      </div>
    </section>
  );
}
