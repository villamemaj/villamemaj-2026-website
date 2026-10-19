begin;

-- Public media is read-only from the browser. Staff writes go through authenticated
-- server routes using the server-only Supabase service client.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hotel-media',
  'hotel-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table public.hotel_gallery_images
  add column if not exists storage_path text,
  add column if not exists alt_text_en text not null default '',
  add column if not exists alt_text_el text not null default '';

create table if not exists public.hotel_room_gallery_images (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.hotel_rooms(id) on delete cascade,
  image_url text not null,
  storage_path text,
  alt_text_en text not null default '',
  alt_text_el text not null default '',
  caption_en text,
  caption_el text,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hotel_room_gallery_alt_en_length check (char_length(alt_text_en) <= 250),
  constraint hotel_room_gallery_alt_el_length check (char_length(alt_text_el) <= 250),
  constraint hotel_room_gallery_caption_en_length check (caption_en is null or char_length(caption_en) <= 500),
  constraint hotel_room_gallery_caption_el_length check (caption_el is null or char_length(caption_el) <= 500),
  constraint hotel_room_gallery_sort_order_range check (sort_order between 0 and 9999)
);

create index if not exists hotel_room_gallery_room_order_idx
  on public.hotel_room_gallery_images (room_id, active, sort_order);
create unique index if not exists hotel_room_gallery_one_cover_idx
  on public.hotel_room_gallery_images (room_id)
  where is_cover = true and active = true;

alter table public.hotel_room_gallery_images enable row level security;

revoke all on table public.hotel_room_gallery_images from anon, authenticated;
grant select on table public.hotel_room_gallery_images to anon, authenticated;
grant all on table public.hotel_room_gallery_images to service_role;
grant select on table public.hotel_gallery_images to anon, authenticated;
grant all on table public.hotel_gallery_images to service_role;

drop policy if exists "Public can view active room gallery images" on public.hotel_room_gallery_images;
create policy "Public can view active room gallery images"
  on public.hotel_room_gallery_images
  for select
  to public
  using (
    active = true
    and exists (
      select 1 from public.hotel_rooms r
      where r.id = hotel_room_gallery_images.room_id
        and r.active = true
    )
  );

commit;
