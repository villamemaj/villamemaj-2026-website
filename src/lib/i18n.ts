import type { AmenityKey } from "./types";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "./site";

export interface Dictionary {
  nav: {
    home: string;
    rooms: string;
    gallery: string;
    booking: string;
    contact: string;
    travel: string;
    menu: string;
    closeMenu: string;
    language: string;
    mainNavigation: string;
  };
  hero: {
    title: string;
    subtitle: string;
    ctaRooms: string;
    ctaBook: string;
  };
  home: {
    welcomeLabel: string;
    welcomeTitle: string;
    welcomeText: string;
    features: { title: string; text: string }[];
    roomsTitle: string;
    roomsText: string;
    viewAll: string;
    galleryTitle: string;
    galleryText: string;
    ctaTitle: string;
    ctaText: string;
    ctaBook: string;
  };
  editorialHome: {
    heroKicker: string;
    heroNote: string;
    scroll: string;
    location: string;
    introMeta: string;
    momentOneLabel: string;
    momentOneTitle: string;
    momentTwoLabel: string;
    momentTwoTitle: string;
    momentThreeLabel: string;
    momentThreeTitle: string;
    roomsFootnote: string;
    galleryCaptionFallback: string;
    galleryFooter: string;
    introKicker: string;
    introTitle: string;
    introBody: string;
    introLink: string;
    momentsKicker: string;
    momentsTitle: string;
    momentsBody: string;
    roomsKicker: string;
    galleryKicker: string;
    galleryTitle: string;
    galleryBody: string;
    quote: string;
    quoteNote: string;
    ctaKicker: string;
    ctaTitle: string;
    sizeLabel: string;
    capacityLabel: string;
    amenitiesLabel: string;
    bookingSearch: {
      title: string;
      arrival: string;
      departure: string;
      guests: string;
      adults: string;
      children: string;
      action: string;
      note: string;
      invalidDates: string;
      invalidGuests: string;
    };
  };
  rooms: {
    title: string;
    subtitle: string;
    from: string;
    perNight: string;
    guests: string;
    size: string;
    viewDetails: string;
    book: string;
    amenities: string;
    empty: string;
  };
  room: {
    backToRooms: string;
    bookThisRoom: string;
    notFound: string;
  };
  booking: {
    title: string;
    subtitle: string;
    roomLabel: string;
    anyRoom: string;
    name: string;
    email: string;
    phone: string;
    checkIn: string;
    checkOut: string;
    guests: string;
    message: string;
    messagePlaceholder: string;
    submit: string;
    sending: string;
    successTitle: string;
    successText: string;
    errorText: string;
    newRequest: string;
  };
  contact: {
    title: string;
    subtitle: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    submit: string;
    sending: string;
    successTitle: string;
    successText: string;
    errorText: string;
    phoneLabel: string;
    emailLabel: string;
    addressLabel: string;
    newMessage: string;
  };
  gallery: {
    title: string;
    subtitle: string;
    empty: string;
    openImage: string;
    closeImage: string;
    previousImage: string;
    nextImage: string;
  };
  footer: {
    tagline: string;
    quickLinks: string;
    contact: string;
    rights: string;
  };
  amenities: Record<AmenityKey, string>;
}

const dictionaries: Record<Locale, () => Promise<{ default: Dictionary }>> = {
  el: () => import("./dictionaries/el"),
  en: () => import("./dictionaries/en"),
  fr: () => import("./dictionaries/fr"),
  sq: () => import("./dictionaries/sq"),
  de: () => import("./dictionaries/de"),
  it: () => import("./dictionaries/it"),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const safeLocale = LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  const mod = await dictionaries[safeLocale]();
  return mod.default;
}
