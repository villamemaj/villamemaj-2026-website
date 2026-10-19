"use client";

import type { Locale } from "@/lib/site";

const labels: Record<Locale, string> = {
  el: "Ρυθμίσεις cookies",
  en: "Cookie settings",
  fr: "Paramètres des cookies",
  sq: "Cilësimet e cookies",
  de: "Cookie-Einstellungen",
};

export default function CookieSettingsButton({ locale }: { locale: Locale }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event("open-cookie-settings"))} className="cookie-settings-link">
      {labels[locale]}
    </button>
  );
}
