export const SITE_MEDIA_SLOTS = [
  { key: "home_hero", label: "Homepage · main hero", group: "Homepage", defaultImage: "/723811999.jpg", description: "The full-width first impression at the top of the homepage." },
  { key: "home_hero_detail", label: "Homepage · floating detail", group: "Homepage", defaultImage: "/902234060.jpg", description: "The supporting image beside the main homepage headline." },
  { key: "home_intro_main", label: "Homepage · introduction", group: "Homepage", defaultImage: "/723812114.jpg", description: "The large image in the hospitality introduction." },
  { key: "home_intro_kitchen", label: "Homepage · secondary detail", group: "Homepage", defaultImage: "/723812074.jpg", description: "The smaller supporting image in the introduction." },
  { key: "home_moment_terrace", label: "Homepage · terrace moment", group: "Homepage", defaultImage: "/769092652.jpg", description: "The outdoor terrace story card." },
  { key: "home_moment_bedroom", label: "Homepage · bedroom moment", group: "Homepage", defaultImage: "/723812029.jpg", description: "The bedroom story card." },
  { key: "home_moment_coast", label: "Homepage · coastal moment", group: "Homepage", defaultImage: "/902233984.jpg", description: "The coastal view story card." },
  { key: "home_quote", label: "Homepage · quote backdrop", group: "Homepage", defaultImage: "/723815742.jpg", description: "The subtle background image behind the closing quote." },
  { key: "rooms_hero", label: "Rooms page · hero", group: "Page banners", defaultImage: "/902234060.jpg", description: "Banner image shown above the full room list." },
  { key: "booking_hero", label: "Booking page · hero", group: "Page banners", defaultImage: "/902234060.jpg", description: "Banner image shown above the reservation form." },
  { key: "flights_hero", label: "Flights page · hero", group: "Page banners", defaultImage: "/723812114.jpg", description: "Banner image on the guest-facing flight search page." },
  { key: "gallery_hero", label: "Gallery page · hero", group: "Page banners", defaultImage: "/723812114.jpg", description: "Banner image shown above the public image gallery." },
  { key: "travel_hero", label: "Travel page · hero", group: "Page banners", defaultImage: "/902234060.jpg", description: "Banner image on the travel-planning page." },
  { key: "contact_hero", label: "Contact page · hero", group: "Page banners", defaultImage: "/723812114.jpg", description: "Banner image above contact details and the contact form." },
  { key: "policies_hero", label: "Policies page · hero", group: "Page banners", defaultImage: "/723812114.jpg", description: "Banner image above the guest information and policy hub." },
  { key: "faq_hero", label: "FAQ page · hero", group: "Page banners", defaultImage: "/902234060.jpg", description: "Banner image on the frequently asked questions page." },
  { key: "legal_hero", label: "Legal documents · hero", group: "Page banners", defaultImage: "/723811999.jpg", description: "Shared banner image on terms, privacy, cookies, cancellation and other legal detail pages." },
] as const;

export type SiteMediaSlotKey = (typeof SITE_MEDIA_SLOTS)[number]["key"];

export type SiteMediaAssignment = {
  slot_key: SiteMediaSlotKey;
  gallery_image_id: string;
  alt_text_en: string | null;
  alt_text_el: string | null;
  updated_at?: string;
};
