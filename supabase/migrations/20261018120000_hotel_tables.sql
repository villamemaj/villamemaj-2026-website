-- Hotel tables for Villa Memaj / J&M Villas
-- Matches column expectations in src/lib/types.ts and form components.

create table if not exists public.hotel_rooms (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_el text not null,
  name_en text not null,
  description_el text not null default '',
  description_en text not null default '',
  capacity int not null default 2,
  size_sqm int,
  price_per_night numeric(10,2),
  currency text not null default 'EUR',
  amenities text[] not null default '{}',
  image_url text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hotel_gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption_el text,
  caption_en text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.hotel_bookings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.hotel_rooms(id),
  guest_name text not null,
  guest_email text not null,
  guest_phone text,
  check_in date not null,
  check_out date not null,
  guests int not null default 1,
  message text,
  status text not null default 'pending' check (status in ('pending','confirmed','checked_in','checked_out','cancelled')),
  total_price numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint check_dates check (check_out > check_in)
);

create table if not exists public.hotel_contact_messages (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  guest_email text not null,
  subject text,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_hotel_bookings_dates on public.hotel_bookings(check_in, check_out);
create index if not exists idx_hotel_bookings_status on public.hotel_bookings(status);
create index if not exists idx_hotel_rooms_slug on public.hotel_rooms(slug);

-- RLS
alter table public.hotel_rooms enable row level security;
alter table public.hotel_gallery_images enable row level security;
alter table public.hotel_bookings enable row level security;
alter table public.hotel_contact_messages enable row level security;

create policy "Public can view active rooms"
  on public.hotel_rooms for select
  using (active = true);

create policy "Public can view active gallery"
  on public.hotel_gallery_images for select
  using (active = true);

create policy "Anyone can submit a booking"
  on public.hotel_bookings for insert
  with check (true);

create policy "Anyone can submit a contact message"
  on public.hotel_contact_messages for insert
  with check (true);

-- Seed rooms (real room types from the Booking.com listing)
insert into public.hotel_rooms (slug, name_el, name_en, description_el, description_en, capacity, size_sqm, price_per_night, amenities, image_url, sort_order) values
(
  'triple-room',
  'Τρικλίνο Δωμάτιο',
  'Triple Room',
  'Δωμάτιο 20 τετραγωνικών μέτρων με μπαλκόνι, κλιματισμό και θέα στον κήπο. Ιδανικό για τρεις επισκέπτες, με άνετο κρεβάτι και ξεχωριστό μπάνιο.',
  'A 20 m² room with balcony, air conditioning and garden view. Ideal for three guests, with a comfortable bed and private bathroom.',
  3, 20, 65.00,
  array['wifi','ac','tv','balcony'],
  '/723812096.jpg',
  1
),
(
  'family-room',
  'Οικογενειακό Δωμάτιο',
  'Family Room',
  'Γενναιόδωρο δωμάτιο 50 τετραγωνικών μέτρων, ιδανικό για οικογένειες. Διαθέτει μπαλκόνι, κλιματισμό, τηλεόραση και ξεχωριστές χώρους ύπνου.',
  'A generous 50 m² room, ideal for families. It features a balcony, air conditioning, TV and separate sleeping areas.',
  4, 50, 120.00,
  array['wifi','ac','tv','balcony','sea_view'],
  '/902234060.jpg',
  2
),
(
  'deluxe-apartment',
  'Deluxe Διαμέρισμα',
  'Deluxe Apartment',
  'Πολυτελές διαμέρισμα 60 τετραγωνικών μέτρων με πλήρως εξοπλισμένη κουζίνα, μπαλκόνι με θέα στη θάλασσα και σύγχρονες ανέσεις για ανέσια διαμονή.',
  'A luxurious 60 m² apartment with a fully equipped kitchen, a balcony with sea view and modern comforts for a pleasant stay.',
  5, 60, 150.00,
  array['wifi','ac','tv','balcony','sea_view','kitchen','parking'],
  '/769092636.jpg',
  3
)
on conflict (slug) do nothing;

-- Seed gallery (real property photos)
insert into public.hotel_gallery_images (image_url, caption_el, caption_en, sort_order) values
('/723811999.jpg', 'Εξωτερική άποψη', 'Exterior view', 1),
('/723815742.jpg', 'Κύρια είσοδος', 'Main entrance', 2),
('/723812114.jpg', 'Χώρος καθιστικού', 'Living area', 3),
('/723812074.jpg', 'Κουζίνα', 'Kitchen', 4),
('/723812029.jpg', 'Υπνοδωμάτιο', 'Bedroom', 5),
('/723811974.jpg', 'Μπάνιο', 'Bathroom', 6),
('/769092652.jpg', 'Βεράντα', 'Veranda', 7),
('/902233984.jpg', 'Θέα στη θάλασσα', 'Sea view', 8),
('/723853291.jpg', 'Χώρος φιλοξενίας', 'Guest lounge', 9),
('/723839362.jpg', 'Εσωτερική αυλή', 'Inner courtyard', 10)
on conflict do nothing;
