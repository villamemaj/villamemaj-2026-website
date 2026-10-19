export type AmenityKey =
  | "wifi"
  | "ac"
  | "tv"
  | "minibar"
  | "balcony"
  | "sea_view"
  | "kitchen"
  | "breakfast"
  | "parking"
  | "workspace";

export interface HotelRoom {
  id: string;
  slug: string;
  name_el: string;
  name_en: string;
  description_el: string | null;
  description_en: string | null;
  capacity: number;
  size_sqm: number | null;
  price_per_night: number | null;
  currency: string;
  amenities: AmenityKey[];
  image_url: string | null;
  sort_order: number;
  active: boolean;
  gallery_images?: HotelRoomGalleryImage[];
}

export interface HotelRoomGalleryImage {
  id: string;
  room_id: string;
  image_url: string;
  storage_path: string | null;
  alt_text_en: string;
  alt_text_el: string;
  caption_en: string | null;
  caption_el: string | null;
  sort_order: number;
  is_cover: boolean;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HotelGalleryImage {
  id: string;
  image_url: string;
  caption_el: string | null;
  caption_en: string | null;
  sort_order: number;
  active?: boolean;
  storage_path?: string | null;
  alt_text_en?: string | null;
  alt_text_el?: string | null;
  created_at?: string;
}

export interface BookingInsert {
  room_id?: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone?: string | null;
  check_in: string;
  check_out: string;
  guests: number;
  message?: string | null;
}

export interface ContactMessageInsert {
  guest_name: string;
  guest_email: string;
  subject?: string | null;
  message: string;
}

export interface ContactInfo {
  email: string | null;
  phone: string | null;
  address_el: string | null;
  address_en: string | null;
  notification_emails?: string[] | null;
}
