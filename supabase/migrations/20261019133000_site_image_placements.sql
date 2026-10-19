begin;

create table if not exists public.hotel_site_media_slots (
  slot_key text primary key,
  gallery_image_id uuid not null references public.hotel_gallery_images(id) on delete cascade,
  alt_text_en text not null default '',
  alt_text_el text not null default '',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint hotel_site_media_slot_key_check check (slot_key in (
    'home_hero',
    'home_hero_detail',
    'home_intro_main',
    'home_intro_kitchen',
    'home_moment_terrace',
    'home_moment_bedroom',
    'home_moment_coast',
    'home_quote',
    'rooms_hero',
    'gallery_hero',
    'travel_hero',
    'contact_hero',
    'policies_hero',
    'faq_hero',
    'legal_hero'
  )),
  constraint hotel_site_media_alt_en_length check (char_length(alt_text_en) <= 250),
  constraint hotel_site_media_alt_el_length check (char_length(alt_text_el) <= 250)
);

create index if not exists hotel_site_media_slots_gallery_image_idx
  on public.hotel_site_media_slots (gallery_image_id);

alter table public.hotel_site_media_slots enable row level security;
revoke all on table public.hotel_site_media_slots from anon, authenticated;
grant select on table public.hotel_site_media_slots to anon, authenticated;
grant all on table public.hotel_site_media_slots to service_role;

drop policy if exists "Public can view active site media placements" on public.hotel_site_media_slots;
create policy "Public can view active site media placements"
  on public.hotel_site_media_slots
  for select
  to public
  using (
    exists (
      select 1 from public.hotel_gallery_images i
      where i.id = hotel_site_media_slots.gallery_image_id
        and i.active = true
    )
  );

commit;
