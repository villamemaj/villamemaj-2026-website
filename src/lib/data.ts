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
