import { getSupabase } from "./supabase";
import type { HotelGalleryImage, HotelRoom } from "./types";

export async function getRooms(): Promise<HotelRoom[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("hotel_rooms")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as HotelRoom[];
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
    return (data ?? null) as HotelRoom | null;
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
        "privacy_en", "privacy_el", "taxes_included", "tax_label", "tax_rate", "damage_deposit"
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
