import { getSupabase } from "./supabase";
import type { HotelGalleryImage, HotelRoom, HotelRoomGalleryImage } from "./types";


async function attachRoomGallery(rooms: HotelRoom[]): Promise<HotelRoom[]> {
  if (rooms.length === 0) return rooms;
  try {
    const ids = rooms.map((room) => room.id);
    const { data, error } = await getSupabase()
      .from("hotel_room_gallery_images")
      .select("id,room_id,image_url,storage_path,alt_text_en,alt_text_el,caption_en,caption_el,sort_order,is_cover,active,created_at,updated_at")
      .in("room_id", ids)
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error || !data) return rooms;

    const photosByRoom = new Map<string, HotelRoomGalleryImage[]>();
    for (const photo of data as HotelRoomGalleryImage[]) {
      const group = photosByRoom.get(photo.room_id) ?? [];
      group.push(photo);
      photosByRoom.set(photo.room_id, group);
    }
    return rooms.map((room) => {
      const gallery_images = photosByRoom.get(room.id) ?? [];
      const cover = gallery_images.find((photo) => photo.is_cover) ?? gallery_images[0];
      return { ...room, gallery_images, image_url: cover?.image_url ?? room.image_url };
    });
  } catch {
    return rooms;
  }
}

export async function getRooms(): Promise<HotelRoom[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("hotel_rooms")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return attachRoomGallery((data ?? []) as HotelRoom[]);
  } catch {
    return [];
  }
}

export async function getRoomBySlug(slug: string): Promise<HotelRoom | null> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("hotel_rooms")
      .select("*")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return (await attachRoomGallery([data as HotelRoom]))[0] ?? null;
  } catch {
    return null;
  }
}

export async function getGalleryImages(): Promise<HotelGalleryImage[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("hotel_gallery_images")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as HotelGalleryImage[];
  } catch {
    return [];
  }
}


export type PublicHousePolicySettings = {
  check_in_time: string;
  check_out_time: string;
  smoking_allowed: boolean;
  pets_allowed: boolean;
  children_allowed: boolean;
  parties_allowed: boolean;
  quiet_hours: string;
  children_policy: string;
  child_rates_configured: boolean;
  cots_available: boolean;
  extra_beds_available: boolean;
  guest_address_required: boolean;
  guest_phone_required: boolean;
  minimum_check_in_age: number | null;
  curfew: string;
  internet_information: string;
  parking_information: string;
  damage_policy: string;
  additional_fees_note: string;
  accepted_payment_methods: string[];
  monthly_stays_allowed: boolean;
  max_stay_nights: number;
  house_rules_en: string;
  house_rules_el: string;
  terms_en: string;
  terms_el: string;
  privacy_en: string;
  privacy_el: string;
  taxes_included: boolean;
  tax_label: string | null;
  tax_rate: number | null;
  damage_deposit: number;
  damage_deposit_currency: "EUR" | "ALL";
  arrival_instructions_en: string;
  arrival_instructions_el: string;
  local_guide_en: string;
  local_guide_el: string;
  public_review_url: string | null;
};

export async function getPublicHousePolicySettings(): Promise<PublicHousePolicySettings | null> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("hotel_house_policies")
      .select([
        "check_in_time", "check_out_time", "smoking_allowed", "pets_allowed",
        "children_allowed", "parties_allowed", "quiet_hours", "children_policy",
        "child_rates_configured", "cots_available", "extra_beds_available",
        "guest_address_required", "guest_phone_required", "minimum_check_in_age",
        "curfew", "internet_information", "parking_information", "damage_policy",
        "additional_fees_note", "accepted_payment_methods", "monthly_stays_allowed",
        "max_stay_nights", "house_rules_en", "house_rules_el", "terms_en", "terms_el",
        "privacy_en", "privacy_el", "taxes_included", "tax_label", "tax_rate", "damage_deposit",
        "damage_deposit_currency", "arrival_instructions_en", "arrival_instructions_el",
        "local_guide_en", "local_guide_el", "public_review_url"
      ].join(", "))
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return data as unknown as PublicHousePolicySettings;
  } catch {
    // The existing static legal copy remains as a fallback during deployment or
    // when the database is temporarily unavailable.
    return null;
  }
}


export type PublicContactInfo = {
  phone: string | null;
  email: string | null;
  address_en: string | null;
  address_el: string | null;
};

/** Only reads the four explicitly public contact fields; private notification recipients are never selected. */
export async function getContactInfo(): Promise<PublicContactInfo> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("hotel_house_policies")
      .select("contact_phone,contact_email,address_en,address_el")
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return {
      phone: typeof data?.contact_phone === "string" ? data.contact_phone : null,
      email: typeof data?.contact_email === "string" ? data.contact_email : null,
      address_en: typeof data?.address_en === "string" ? data.address_en : null,
      address_el: typeof data?.address_el === "string" ? data.address_el : null,
    };
  } catch {
    return { phone: null, email: null, address_en: null, address_el: null };
  }
}
