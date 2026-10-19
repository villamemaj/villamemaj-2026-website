"use client";

export default function CookieSettingsLink({ locale }: { locale: string }) {
  const label = locale === "el" ? "Ρυθμίσεις cookies"
    : locale === "fr" ? "Paramètres des cookies"
    : locale === "sq" ? "Cilësimet e cookies"
    : locale === "de" ? "Cookie-Einstellungen"
    : locale === "it" ? "Impostazioni cookie"
    : "Cookie settings";
  return (
    <button
      type="button"
      className="cookie-settings-footer-link"
      onClick={() => window.dispatchEvent(new Event("villa-memaj:open-cookie-settings"))}
    >
      {label}
    </button>
  );
}
