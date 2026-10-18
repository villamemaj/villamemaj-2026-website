
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists public.hotel_staff_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','manager','receptionist','housekeeping','accountant')),
  is_active boolean not null default true,
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.hotel_staff_memberships enable row level security;

create or replace function private.has_hotel_role(allowed_roles text[])
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.hotel_staff_memberships m
    where m.user_id = auth.uid() and m.is_active and m.role = any (allowed_roles)
  );
$$;
revoke all on function private.has_hotel_role(text[]) from public, anon;
grant execute on function private.has_hotel_role(text[]) to authenticated;

drop policy if exists hotel_staff_self_or_manager_read on public.hotel_staff_memberships;
create policy hotel_staff_self_or_manager_read on public.hotel_staff_memberships
for select to authenticated
using (user_id = auth.uid() or private.has_hotel_role(array['owner','manager']));

create table if not exists public.hotel_room_rates (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.hotel_rooms(id) on delete cascade,
  currency_code char(3) not null check (currency_code in ('EUR','ALL')),
  nightly_rate numeric(12,2) not null check (nightly_rate >= 0),
  is_active boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id, currency_code)
);
alter table public.hotel_room_rates enable row level security;

drop policy if exists hotel_room_rates_public_read on public.hotel_room_rates;
create policy hotel_room_rates_public_read on public.hotel_room_rates
for select to anon, authenticated
using (is_active and exists (select 1 from public.hotel_rooms r where r.id = room_id and r.active));

drop policy if exists hotel_room_rates_staff_manage on public.hotel_room_rates;
create policy hotel_room_rates_staff_manage on public.hotel_room_rates
for all to authenticated
using (private.has_hotel_role(array['owner','manager']))
with check (private.has_hotel_role(array['owner','manager']));

grant select on public.hotel_room_rates to anon, authenticated;
grant insert, update, delete on public.hotel_room_rates to authenticated;
grant select on public.hotel_staff_memberships to authenticated;

insert into public.hotel_room_rates(room_id,currency_code,nightly_rate,is_active)
select id, upper(currency)::char(3), price_per_night, active
from public.hotel_rooms
where price_per_night is not null and upper(currency) in ('EUR','ALL')
on conflict (room_id,currency_code) do nothing;
;
