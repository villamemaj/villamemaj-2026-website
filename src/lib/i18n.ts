import type { AmenityKey } from "./types";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "./site";

export interface Dictionary {
  nav: { home: string; rooms: string; gallery: string; booking: string; contact: string };
  hero: { title: string; subtitle: string; ctaRooms: string; ctaBook: string };
  home: {
    welcomeLabel: string; welcomeTitle: string; welcomeText: string;
    features: { title: string; text: string }[];
    roomsTitle: string; roomsText: string; viewAll: string; galleryTitle: string; galleryText: string;
    ctaTitle: string; ctaText: string; ctaBook: string;
  };
  rooms: {
    title: string; subtitle: string; from: string; perNight: string; guests: string; size: string;
    viewDetails: string; book: string; amenities: string; empty: string;
  };
  room: { backToRooms: string; bookThisRoom: string; notFound: string };
  booking: {
    title: string; subtitle: string; roomLabel: string; anyRoom: string; name: string; email: string;
    phone: string; checkIn: string; checkOut: string; guests: string; message: string;
    messagePlaceholder: string; submit: string; sending: string; successTitle: string; successText: string;
    errorText: string; newRequest: string;
  };
  contact: {
    title: string; subtitle: string; name: string; email: string; subject: string; message: string;
    submit: string; sending: string; successTitle: string; successText: string; errorText: string;
    phoneLabel: string; emailLabel: string; addressLabel: string; newMessage: string;
  };
  gallery: { title: string; subtitle: string; empty: string };
  footer: { tagline: string; quickLinks: string; contact: string; rights: string };
  amenities: Record<AmenityKey, string>;
}

const dictionaries: Record<Locale, () => Promise<{ default: Dictionary }>> = {
  el: () => import("./dictionaries/el"),
  en: () => import("./dictionaries/en"),
  fr: () => import("./dictionaries/fr"),
  sq: () => import("./dictionaries/sq"),
  de: () => import("./dictionaries/de"),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const safeLocale = LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  const mod = await dictionaries[safeLocale]();
  return mod.default;
}
