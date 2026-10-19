"use client";

import Script from "next/script";
import { useState } from "react";
import type { Locale } from "@/lib/site";

const COPY: Record<Locale, {
  title: string; open: string; loading: string; privacy: string; disclaimer: string; fallback: string;
}> = {
  en: {
    title: "Find a flight that fits your journey",
    open: "Open flight search",
    loading: "Preparing Skyscanner flight search…",
    privacy: "Skyscanner privacy policy",
    disclaimer: "Flight search is supplied by Skyscanner. Searches, results, prices, airline rules and ticket purchases are handled by Skyscanner and its travel partners, not by Villa Memaj.",
    fallback: "If the search widget does not load, open Skyscanner in a new tab.",
  },
  el: {
    title: "Βρείτε πτήση που ταιριάζει στο ταξίδι σας",
    open: "Άνοιγμα αναζήτησης πτήσεων",
    loading: "Φόρτωση αναζήτησης Skyscanner…",
    privacy: "Πολιτική απορρήτου Skyscanner",
    disclaimer: "Η αναζήτηση πτήσεων παρέχεται από το Skyscanner. Οι αναζητήσεις, τα αποτελέσματα, οι τιμές, οι κανόνες αεροπορικών εταιρειών και οι αγορές εισιτηρίων διεκπεραιώνονται από το Skyscanner και τους συνεργάτες του, όχι από τη Villa Memaj.",
    fallback: "Αν δεν φορτωθεί το widget, ανοίξτε το Skyscanner σε νέα καρτέλα.",
  },
  fr: {
    title: "Trouvez le vol adapté à votre voyage",
    open: "Ouvrir la recherche de vols",
    loading: "Préparation de la recherche Skyscanner…",
    privacy: "Politique de confidentialité de Skyscanner",
    disclaimer: "La recherche de vols est fournie par Skyscanner. Les recherches, résultats, prix, règles des compagnies et achats de billets relèvent de Skyscanner et de ses partenaires, et non de Villa Memaj.",
    fallback: "Si le widget ne se charge pas, ouvrez Skyscanner dans un nouvel onglet.",
  },
  sq: {
    title: "Gjeni fluturimin e duhur për udhëtimin tuaj",
    open: "Hap kërkimin e fluturimeve",
    loading: "Po përgatitet kërkimi në Skyscanner…",
    privacy: "Politika e privatësisë e Skyscanner",
    disclaimer: "Kërkimi i fluturimeve ofrohet nga Skyscanner. Kërkimet, rezultatet, çmimet, rregullat e kompanive ajrore dhe blerja e biletave trajtohen nga Skyscanner dhe partnerët e tij, jo nga Villa Memaj.",
    fallback: "Nëse widget-i nuk ngarkohet, hapni Skyscanner në një skedë të re.",
  },
  de: {
    title: "Finden Sie den passenden Flug für Ihre Reise",
    open: "Flugsuche öffnen",
    loading: "Skyscanner-Flugsuche wird vorbereitet…",
    privacy: "Datenschutzerklärung von Skyscanner",
    disclaimer: "Die Flugsuche wird von Skyscanner bereitgestellt. Suchen, Ergebnisse, Preise, Airline-Regeln und Ticketkäufe werden von Skyscanner und dessen Reisepartnern abgewickelt, nicht von Villa Memaj.",
    fallback: "Falls das Widget nicht lädt, öffnen Sie Skyscanner in einem neuen Tab.",
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

export default function SkyscannerFlightSearch({ locale }: { locale: Locale }) {
  const [activated, setActivated] = useState(false);
  const t = COPY[locale];

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
          <button type="button" onClick={() => setActivated(true)} className="button-dark">
            {t.open} <span aria-hidden="true">↗</span>
          </button>
        </div>
      ) : (
        <div className="travel-flight-frame" aria-live="polite">
          <div className="travel-flight-loading" role="status">{t.loading}</div>
          <div
            data-skyscanner-widget="FlightSearchWidget"
            data-locale={widgetLocale(locale)}
            data-flight-type="return"
            data-target="_blank"
            data-colour="transparent"
            data-button-label={t.open}
            data-widget-border-radius="12"
            data-widget-padding="12px"
            data-web-only-redirects="true"
          />
          <Script
            src="https://widgets.skyscanner.net/widget-server/v2.0/widgets-constructor.js"
            strategy="afterInteractive"
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
