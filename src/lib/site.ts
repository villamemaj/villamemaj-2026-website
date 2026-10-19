export type Locale = "el" | "en" | "fr" | "sq" | "de";

export const LOCALES: Locale[] = ["el", "en", "fr", "sq", "de"];
export const DEFAULT_LOCALE: Locale = "el";

export const LOCALE_NAMES: Record<Locale, string> = {
  el: "Ελληνικά",
  en: "English",
  fr: "Français",
  sq: "Shqip",
  de: "Deutsch",
};

export const LOCALE_NATIVE_NAMES: Record<Locale, string> = {
  el: "Ελληνικά",
  en: "English",
  fr: "Français",
  sq: "Shqip",
  de: "Deutsch",
};

export const SITE_CONFIG = {
  name: "Villa Memaj",
  tagline: {
    el: "Ησυχία, φως και θάλασσα σε ένα μέρος",
    en: "Peace, light and sea in one place",
    fr: "Un séjour paisible entre lumière et mer",
    sq: "Qetësi, dritë dhe det në një vend",
    de: "Ruhe, Licht und Meer an einem Ort",
  } satisfies Record<Locale, string>,
  email: "info@villamemaj.com",
  phone: "+355 69 000 0000",
  address: {
    el: "Αλβανία",
    en: "Albania",
    fr: "Albanie",
    sq: "Shqipëri",
    de: "Albanien",
  } satisfies Record<Locale, string>,
  currency: "€",
} as const;

export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}
