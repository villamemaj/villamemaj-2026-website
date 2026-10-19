export const SITE_CONFIG = {
  name: "Villa Memaj",
  url: "https://villamemaj-2026-website.vercel.app",
  tagline: {
    el: "Ησυχία, φως και θάλασσα σε ένα μέρος",
    en: "Peace, light and sea in one place",
    fr: "Calme, lumière et mer en un seul lieu",
    sq: "Qetësi, dritë dhe det në një vend",
    de: "Ruhe, Licht und Meer an einem Ort",
    it: "Tranquillità, luce e mare in un solo luogo",
  },
  email: "info@villamemaj.com",
  phone: "+355 69 000 0000",
  address: {
    el: "Αλβανία",
    en: "Albania",
    fr: "Albanie",
    sq: "Shqipëri",
    de: "Albanien",
    it: "Albania",
  },
  currency: "€",
} as const;

export type Locale = "el" | "en" | "fr" | "sq" | "de" | "it";

export const LOCALES: Locale[] = ["el", "en", "fr", "sq", "de", "it"];
export const DEFAULT_LOCALE: Locale = "el";

export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}
