begin;

alter table public.hotel_site_media_slots
  drop constraint if exists hotel_site_media_slot_key_check;

alter table public.hotel_site_media_slots
  add constraint hotel_site_media_slot_key_check
  check (slot_key in (
    'home_hero',
    'home_hero_detail',
    'home_intro_main',
    'home_intro_kitchen',
    'home_moment_terrace',
    'home_moment_bedroom',
    'home_moment_coast',
    'home_quote',
    'rooms_hero',
    'booking_hero',
    'flights_hero',
    'gallery_hero',
    'travel_hero',
    'contact_hero',
    'policies_hero',
    'faq_hero',
    'legal_hero'
  ));

commit;
