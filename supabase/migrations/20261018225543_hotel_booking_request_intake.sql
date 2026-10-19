create table if not exists public.hotel_booking_requests (
 id uuid primary key default gen_random_uuid(),
 public_reference text not null unique,
 room_id uuid not null references public.hotel_rooms(id) on delete restrict,
 guest_name text not null check (length(trim(guest_name)) between 2 and 120),
 guest_email text not null check (length(trim(guest_email)) between 5 and 254),
 guest_phone text,
 check_in date not null,
 check_out date not null,
 adults integer not null check (adults between 1 and 10),
 children integer not null default 0 check (children between 0 and 10),
 currency_code char(3) not null check (currency_code in ('EUR','ALL')),
 nightly_rate numeric(12,2) not null check (nightly_rate >= 0),
 nights integer not null check (nights between 1 and 30),
 quoted_total numeric(12,2) not null check (quoted_total >= 0),
 special_requests text,
 status text not null default 'pending_review' check (status in ('pending_review','accepted','declined','expired')),
 source text not null default 'direct_website',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (check_out > check_in),
 check (quoted_total = nightly_rate * nights)
);
create index if not exists hotel_booking_requests_created_idx on public.hotel_booking_requests(created_at desc);
create index if not exists hotel_booking_requests_email_idx on public.hotel_booking_requests(lower(guest_email),created_at desc);
alter table public.hotel_booking_requests enable row level security;
revoke all on public.hotel_booking_requests from anon, authenticated;
