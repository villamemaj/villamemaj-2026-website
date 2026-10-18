-- ============================================================
-- Villa Memaj / J&M Villas — Booking Platform v2 (additive)
-- Aligned with docs/payment-and-security-plan.md rollout order.
-- - Keeps hotel_bookings (ALTER, never drops). Public insert policy
--   intentionally UNTOUCHED until the booking Edge Function cutover.
-- - RBAC via public.hotel_staff_memberships + private.has_hotel_role
--   (created in 20261018141333).
-- - Dual-currency rates via hotel_room_rates; no silent conversion.
-- - Versioned cancellation policies snapshotted onto each booking.
-- - Payment ledger hotel_payment_transactions + webhook event table
--   for the future BKT Virtual POS adapter.
-- ============================================================

-- ---------- Reconcile 141333 hotel_room_rates (add date-window columns) ----------
alter table public.hotel_room_rates
  add column if not exists effective_from date,
  add column if not exists effective_until date,
  add constraint hotel_room_rates_dates check (effective_until is null or effective_from is null or effective_until >= effective_from);

-- Staff membership management: owner/manager can provision (server-side
-- workflow only; no self-signup path).
drop policy if exists hotel_staff_owner_manager_manage on public.hotel_staff_memberships;
create policy hotel_staff_owner_manager_manage on public.hotel_staff_memberships
for all to authenticated
using (private.has_hotel_role(array['owner','manager']))
with check (private.has_hotel_role(array['owner','manager']));

-- ---------- Cancellation policies (versioned; draft until owner/legal publish) ----------
create table if not exists public.hotel_cancellation_policies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version integer not null default 1 check (version > 0),
  description text,
  free_cancel_before_hours integer not null default 48 check (free_cancel_before_hours >= 0),
  late_cancel_penalty_type text not null default 'first_night'
    check (late_cancel_penalty_type in ('none','first_night','percent_of_total','full_stay','fixed_amount')),
  late_cancel_penalty_percent numeric(5,2) not null default 100 check (late_cancel_penalty_percent between 0 and 100),
  late_cancel_fixed_eur numeric(12,2) check (late_cancel_fixed_eur is null or late_cancel_fixed_eur >= 0),
  late_cancel_fixed_all numeric(12,2) check (late_cancel_fixed_all is null or late_cancel_fixed_all >= 0),
  no_show_penalty_type text not null default 'full_stay'
    check (no_show_penalty_type in ('none','first_night','percent_of_total','full_stay','fixed_amount')),
  no_show_penalty_percent numeric(5,2) not null default 100 check (no_show_penalty_percent between 0 and 100),
  non_refundable boolean not null default false,
  published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (name, version)
);
alter table public.hotel_cancellation_policies enable row level security;

drop policy if exists hotel_cancel_policies_public_published_read on public.hotel_cancellation_policies;
create policy hotel_cancel_policies_public_published_read on public.hotel_cancellation_policies
for select to anon, authenticated using (published);

drop policy if exists hotel_cancel_policies_staff_read on public.hotel_cancellation_policies;
create policy hotel_cancel_policies_staff_read on public.hotel_cancellation_policies
for select to authenticated using (private.has_hotel_role(array['owner','manager','receptionist','accountant']));

drop policy if exists hotel_cancel_policies_manager_manage on public.hotel_cancellation_policies;
create policy hotel_cancel_policies_manager_manage on public.hotel_cancellation_policies
for all to authenticated using (private.has_hotel_role(array['owner','manager']))
with check (private.has_hotel_role(array['owner','manager']));

-- DRAFT policies (published = false; publish only after owner + local legal review)
insert into public.hotel_cancellation_policies (name, version, description, free_cancel_before_hours, late_cancel_penalty_type, late_cancel_penalty_percent, no_show_penalty_type, non_refundable, published) values
('Flexible', 1, 'Free cancellation until 48 hours before check-in. Later cancellation charged first night. No-show charged full stay.', 48, 'first_night', 100, 'full_stay', false, false),
('Non-refundable', 1, 'Non-refundable rate. Full stay charged at booking; no refund except by explicit administrative exception.', 0, 'full_stay', 100, 'full_stay', true, false)
on conflict (name, version) do nothing;

-- ---------- Rate plans (pricing rules; link to cancellation policies) ----------
create table if not exists public.rate_plans (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name_el text not null,
  name_en text not null,
  description_el text not null default '',
  description_en text not null default '',
  refundable boolean not null default true,
  discount_percent numeric(5,2) not null default 0,
  deposit_percent numeric(5,2) not null default 0,
  balance_due text not null default 'arrival' check (balance_due in ('arrival','prepaid')),
  min_stay int not null default 1,
  cancellation_policy_id uuid references public.hotel_cancellation_policies(id),
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.rate_plans (code, name_el, name_en, description_el, description_en, refundable, discount_percent, deposit_percent, balance_due, min_stay, cancellation_policy_id, sort_order)
select v.code, v.name_el, v.name_en, v.description_el, v.description_en, v.refundable, v.discount, v.deposit, v.balance, v.min_stay, p.id, v.ord
from (values
  ('flexible', 'Ευέλικτο Ταρίφα', 'Flexible Rate',
   'Δωρεάν ακύρωση έως 48 ώρες πριν την άφιξη. Μετά την προθεσμία χρέωση πρώτης νύχτας.',
   'Free cancellation until 48 hours before check-in. After the deadline the first night is charged.',
   true, 0, 0, 'arrival', 1, 'Flexible', 1),
  ('non_refundable', 'Μη Επιστρέψιμο', 'Non-Refundable Rate',
   'Μειωμένη τιμή, μη επιστρέψιμη. Η πληρωμή απαιτείται κατά την κράτηση.',
   'Discounted non-refundable rate. Payment required at the time of booking.',
   false, 10, 100, 'prepaid', 1, 'Non-refundable', 2),
  ('deposit_30', 'Κατάθεση 30%', 'Deposit 30%',
   'Κατάθεση 30% κατά την κράτηση, υπόλοιπο κατά την άφιξη. Δωρεάν ακύρωση έως 48 ώρες πριν.',
   '30% deposit at booking, balance at arrival. Free cancellation until 48 hours before.',
   true, 0, 30, 'arrival', 1, 'Flexible', 3)
) as v(code, name_el, name_en, description_el, description_en, refundable, discount, deposit, balance, min_stay, pol, ord)
left join public.hotel_cancellation_policies p on p.name = v.pol and p.version = 1
on conflict (code) do nothing;

-- Seasonal pricing overrides (per currency; additive)
create table if not exists public.seasonal_prices (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.hotel_rooms(id) on delete cascade,
  rate_plan_id uuid references public.rate_plans(id) on delete set null,
  currency_code char(3) not null default 'EUR' check (currency_code in ('EUR','ALL')),
  start_date date not null,
  end_date date not null,
  price numeric(12,2) not null check (price >= 0),
  min_stay int not null default 1,
  created_at timestamptz not null default now(),
  constraint seasonal_dates check (end_date > start_date)
);
create index if not exists idx_seasonal_lookup on public.seasonal_prices(room_id, start_date, end_date);
alter table public.seasonal_prices enable row level security;
drop policy if exists seasonal_staff_read on public.seasonal_prices;
create policy seasonal_staff_read on public.seasonal_prices for select to authenticated
  using (private.has_hotel_role(array['owner','manager','receptionist']));
drop policy if exists seasonal_manager_write on public.seasonal_prices;
create policy seasonal_manager_write on public.seasonal_prices for insert to authenticated
  with check (private.has_hotel_role(array['owner','manager']));
drop policy if exists seasonal_manager_update on public.seasonal_prices;
create policy seasonal_manager_update on public.seasonal_prices for update to authenticated
  using (private.has_hotel_role(array['owner','manager'])) with check (private.has_hotel_role(array['owner','manager']));
drop policy if exists seasonal_manager_delete on public.seasonal_prices;
create policy seasonal_manager_delete on public.seasonal_prices for delete to authenticated
  using (private.has_hotel_role(array['owner','manager']));

-- ---------- Guests (repeat-guest profiles) ----------
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text not null,
  phone text,
  country text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.guests enable row level security;
drop policy if exists guests_staff_read on public.guests;
create policy guests_staff_read on public.guests for select to authenticated
  using (private.has_hotel_role(array['owner','manager','receptionist','accountant']));
drop policy if exists guests_staff_update on public.guests;
create policy guests_staff_update on public.guests for update to authenticated
  using (private.has_hotel_role(array['owner','manager','receptionist'])) with check (private.has_hotel_role(array['owner','manager','receptionist']));

-- ---------- Extend hotel_bookings ----------
alter table public.hotel_bookings
  add column if not exists currency_code char(3) not null default 'EUR' check (currency_code in ('EUR','ALL')),
  add column if not exists payment_mode text not null default 'pay_at_property' check (payment_mode in ('online','pay_at_property')),
  add column if not exists payment_status text not null default 'unpaid' check (payment_status in ('unpaid','partially_paid','paid','refund_due','refunded')),
  add column if not exists payment_due numeric(12,2) check (payment_due is null or payment_due >= 0),
  add column if not exists cancellation_policy_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists accepted_terms_version text,
  add column if not exists accepted_terms_at timestamptz,
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists confirmed_at timestamptz;

alter table public.hotel_bookings
  add column if not exists code text,
  add column if not exists guest_id uuid references public.guests(id) on delete set null,
  add column if not exists rate_plan_id uuid references public.rate_plans(id),
  add column if not exists adults int,
  add column if not exists children int not null default 0,
  add column if not exists deposit_amount numeric(12,2) not null default 0,
  add column if not exists amount_paid numeric(12,2) not null default 0,
  add column if not exists refunded_amount numeric(12,2) not null default 0,
  add column if not exists source text not null default 'direct' check (source in ('direct','phone','admin','booking_com','other')),
  add column if not exists special_requests text,
  add column if not exists internal_notes text,
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_out_at timestamptz,
  add column if not exists cancelled_by uuid references auth.users(id) on delete set null,
  add column if not exists cancellation_fee_charged numeric(12,2) not null default 0,
  add column if not exists created_by uuid references auth.users(id) on delete set null;

alter table public.hotel_bookings alter column adults set default 1;
update public.hotel_bookings set adults = guests where adults is null;
alter table public.hotel_bookings alter column adults set not null;
alter table public.hotel_bookings alter column status set default 'request';

do $$
begin
  alter table public.hotel_bookings drop constraint if exists hotel_bookings_status_check;
exception when undefined_object then null; end $$;
alter table public.hotel_bookings
  add constraint hotel_bookings_status_check check (status in ('request','hold','confirmed','checked_in','checked_out','cancelled','no_show'));
alter table public.hotel_bookings
  add constraint hotel_bookings_dates_order check (check_out > check_in);

create sequence if not exists public.booking_code_seq;
alter table public.hotel_bookings alter column code set default ('VM-' || to_char(now(), 'YY') || '-' || lpad(nextval('public.booking_code_seq')::text, 4, '0'));
update public.hotel_bookings set code = 'VM-' || to_char(coalesce(created_at, now()), 'YY') || '-' || lpad(nextval('public.booking_code_seq')::text, 4, '0') where code is null;
create unique index if not exists hotel_bookings_code_key on public.hotel_bookings(code);
alter table public.hotel_bookings add column if not exists balance_due numeric(12,2) generated always as (greatest(total_price - amount_paid, 0)) stored;
alter table public.hotel_bookings add column if not exists nights int generated always as (check_out - check_in) stored;

create index if not exists idx_bookings_status on public.hotel_bookings(status);
create index if not exists idx_bookings_room_dates on public.hotel_bookings(room_id, check_in, check_out);
create index if not exists idx_bookings_email on public.hotel_bookings(guest_email);

-- Staff read/write on bookings (public insert policy left untouched for cutover order)
drop policy if exists hotel_bookings_staff_read on public.hotel_bookings;
create policy hotel_bookings_staff_read on public.hotel_bookings for select to authenticated
  using (private.has_hotel_role(array['owner','manager','receptionist','housekeeping','accountant']));
drop policy if exists hotel_bookings_staff_update on public.hotel_bookings;
create policy hotel_bookings_staff_update on public.hotel_bookings for update to authenticated
  using (private.has_hotel_role(array['owner','manager','receptionist'])) with check (private.has_hotel_role(array['owner','manager','receptionist']));
drop policy if exists hotel_bookings_staff_insert on public.hotel_bookings;
create policy hotel_bookings_staff_insert on public.hotel_bookings for insert to authenticated
  with check (private.has_hotel_role(array['owner','manager','receptionist']));

-- ---------- Payment transactions + webhook events (BKT-ready) ----------
create table if not exists public.hotel_payment_transactions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.hotel_bookings(id) on delete restrict,
  kind text not null default 'charge' check (kind in ('charge','refund')),
  provider text not null check (provider in ('bkt_vpos','manual','other')),
  method text not null check (method in ('card','cash','bank_transfer','other')),
  status text not null default 'initiated' check (status in ('initiated','pending','succeeded','failed','cancelled','refund_pending','refunded')),
  amount numeric(12,2) not null check (amount > 0),
  currency_code char(3) not null check (currency_code in ('EUR','ALL')),
  provider_transaction_id text,
  idempotency_key text not null unique,
  failure_code text,
  notes text,
  recorded_by uuid references auth.users(id) on delete set null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists hotel_payment_provider_transaction_unique
  on public.hotel_payment_transactions(provider, provider_transaction_id)
  where provider_transaction_id is not null;
create index if not exists hotel_payment_booking_history_idx
  on public.hotel_payment_transactions(booking_id, created_at desc);
alter table public.hotel_payment_transactions enable row level security;
drop policy if exists hotel_payment_staff_read on public.hotel_payment_transactions;
create policy hotel_payment_staff_read on public.hotel_payment_transactions
for select to authenticated
using (private.has_hotel_role(array['owner','manager','receptionist','accountant']));
drop policy if exists hotel_payment_staff_record on public.hotel_payment_transactions;
create policy hotel_payment_staff_record on public.hotel_payment_transactions
for insert to authenticated
with check (private.has_hotel_role(array['owner','manager','receptionist','accountant']) and provider in ('manual','other'));
drop policy if exists hotel_payment_staff_update on public.hotel_payment_transactions;
create policy hotel_payment_staff_update on public.hotel_payment_transactions
for update to authenticated
using (private.has_hotel_role(array['owner','manager','accountant'])) with check (private.has_hotel_role(array['owner','manager','accountant']));
-- No anon access. Online provider rows only via verified webhooks / server functions.

create table if not exists public.hotel_payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('bkt_vpos','other')),
  provider_event_id text not null,
  payload_sha256 text,
  status text not null default 'received' check (status in ('received','processed','failed','ignored')),
  attempts integer not null default 0 check (attempts >= 0),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, provider_event_id)
);
alter table public.hotel_payment_webhook_events enable row level security;
-- Server-only table: no client policies.

-- Keep booking payment fields in sync with the ledger
create or replace function public.refresh_booking_payment() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_booking uuid;
  v_paid numeric;
  v_refunded numeric;
  v_total numeric;
  v_pending_refund boolean;
begin
  v_booking := coalesce(new.booking_id, old.booking_id);
  select
    coalesce(sum(amount) filter (where kind = 'charge' and status = 'succeeded'), 0),
    coalesce(sum(amount) filter (where kind = 'refund' and status = 'refunded'), 0),
    bool_or(kind = 'refund' and status = 'refund_pending')
  into v_paid, v_refunded, v_pending_refund
  from public.hotel_payment_transactions where booking_id = v_booking;

  select total_price into v_total from public.hotel_bookings where id = v_booking;

  update public.hotel_bookings set
    amount_paid = v_paid,
    refunded_amount = v_refunded,
    payment_due = greatest(v_total - v_paid, 0),
    payment_status = case
      when v_pending_refund then 'refund_due'
      when v_refunded > 0 and v_refunded >= v_paid and v_paid > 0 then 'refunded'
      when v_paid <= 0 then 'unpaid'
      when v_paid >= v_total then 'paid'
      else 'partially_paid'
    end,
    updated_at = now()
  where id = v_booking;

  return coalesce(new, old);
end $$;

drop trigger if exists trg_refresh_payment on public.hotel_payment_transactions;
create trigger trg_refresh_payment
  after insert or update or delete on public.hotel_payment_transactions
  for each row execute function public.refresh_booking_payment();

-- ---------- Audit log ----------
create table if not exists public.hotel_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
create index if not exists hotel_audit_log_created_idx on public.hotel_audit_log(created_at desc);
alter table public.hotel_audit_log enable row level security;
drop policy if exists hotel_audit_manager_read on public.hotel_audit_log;
create policy hotel_audit_manager_read on public.hotel_audit_log
for select to authenticated using (private.has_hotel_role(array['owner','manager']));
-- Writes only via security-definer triggers below.

create or replace function public.hotel_audit_changes() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_before jsonb;
  v_after jsonb;
begin
  if TG_OP = 'UPDATE' then
    v_before := to_jsonb(old);
    v_after := to_jsonb(new);
    if v_before = v_after then return new; end if;
    insert into public.hotel_audit_log (actor_user_id, action, entity_type, entity_id, before_data, after_data)
    values (auth.uid(), 'update', TG_TABLE_NAME, coalesce(new.id::text, new.code), v_before, v_after);
  elsif TG_OP = 'DELETE' then
    insert into public.hotel_audit_log (actor_user_id, action, entity_type, entity_id, before_data)
    values (auth.uid(), 'delete', TG_TABLE_NAME, old.id::text, to_jsonb(old));
    return old;
  elsif TG_OP = 'INSERT' then
    insert into public.hotel_audit_log (actor_user_id, action, entity_type, entity_id, after_data)
    values (auth.uid(), 'create', TG_TABLE_NAME, new.id::text, to_jsonb(new));
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists trg_audit_bookings on public.hotel_bookings;
create trigger trg_audit_bookings after update or delete on public.hotel_bookings
  for each row execute function public.hotel_audit_changes();

drop trigger if exists trg_audit_payments on public.hotel_payment_transactions;
create trigger trg_audit_payments after update or delete on public.hotel_payment_transactions
  for each row execute function public.hotel_audit_changes();

drop trigger if exists trg_audit_rates on public.rate_plans;
create trigger trg_audit_rates after update or delete on public.rate_plans
  for each row execute function public.hotel_audit_changes();

drop trigger if exists trg_audit_rooms on public.hotel_rooms;
create trigger trg_audit_rooms after update or delete on public.hotel_rooms
  for each row execute function public.hotel_audit_changes();

drop trigger if exists trg_audit_cancel_policies on public.hotel_cancellation_policies;
create trigger trg_audit_cancel_policies after update or delete on public.hotel_cancellation_policies
  for each row execute function public.hotel_audit_changes();

-- ---------- House rules / tax config (tax rates configured, never assumed in code) ----------
create table if not exists public.hotel_house_policies (
  id uuid primary key default gen_random_uuid(),
  check_in_time text not null default '14:00',
  check_out_time text not null default '11:00',
  smoking_allowed boolean not null default false,
  pets_allowed boolean not null default false,
  children_allowed boolean not null default true,
  parties_allowed boolean not null default false,
  quiet_hours text not null default '23:00 - 07:00',
  tax_label text,
  tax_rate numeric(5,2) check (tax_rate is null or tax_rate >= 0),
  taxes_included boolean not null default true,
  damage_deposit numeric(12,2) not null default 0,
  extra_fees jsonb not null default '[]'::jsonb,
  terms_el text not null default '',
  terms_en text not null default '',
  privacy_el text not null default '',
  privacy_en text not null default '',
  house_rules_el text not null default '',
  house_rules_en text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
insert into public.hotel_house_policies (id) values ('00000000-0000-0000-0000-000000000001') on conflict (id) do nothing;
alter table public.hotel_house_policies enable row level security;
drop policy if exists house_policies_public_read on public.hotel_house_policies;
create policy house_policies_public_read on public.hotel_house_policies for select using (true);
drop policy if exists house_policies_manager_update on public.hotel_house_policies;
create policy house_policies_manager_update on public.hotel_house_policies for update to authenticated
  using (private.has_hotel_role(array['owner','manager'])) with check (private.has_hotel_role(array['owner','manager']));

-- Manual inventory blocks
create table if not exists public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.hotel_rooms(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text not null default 'other',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint blocked_dates_range check (end_date > start_date)
);
create index if not exists idx_blocked_room_dates on public.blocked_dates(room_id, start_date, end_date);
alter table public.blocked_dates enable row level security;
drop policy if exists blocked_staff_read on public.blocked_dates;
create policy blocked_staff_read on public.blocked_dates for select to authenticated
  using (private.has_hotel_role(array['owner','manager','receptionist','housekeeping']));
drop policy if exists blocked_staff_write on public.blocked_dates;
create policy blocked_staff_write on public.blocked_dates for insert to authenticated
  with check (private.has_hotel_role(array['owner','manager','receptionist']));
drop policy if exists blocked_staff_delete on public.blocked_dates;
create policy blocked_staff_delete on public.blocked_dates for delete to authenticated
  using (private.has_hotel_role(array['owner','manager','receptionist']));

-- ---------- Availability & pricing RPCs ----------
create or replace function public.is_room_available(
  p_room_id uuid, p_check_in date, p_check_out date
) returns boolean
language sql security definer set search_path = public stable as $$
  select not exists (
    select 1 from public.hotel_bookings b
    where b.room_id = p_room_id
      and b.status in ('hold','confirmed','checked_in')
      and (b.status <> 'hold' or b.expires_at > now())
      and b.check_in < p_check_out
      and b.check_out > p_check_in
  )
  and not exists (
    select 1 from public.blocked_dates bd
    where bd.room_id = p_room_id
      and bd.start_date < p_check_out
      and bd.end_date > p_check_in
  );
$$;


-- Currency-aware nightly pricing (hotel_room_rates source of truth; seasonal overrides)
create or replace function public.calculate_booking_price(
  p_room_id uuid, p_rate_plan_id uuid, p_currency char(3), p_check_in date, p_check_out date
) returns numeric
language plpgsql stable security definer set search_path = public as $$
declare
  v_base numeric;
  v_discount numeric := 0;
  v_total numeric := 0;
  d date;
  v_price numeric;
begin
  select coalesce(nightly_rate, 0) into v_base
  from public.hotel_room_rates
  where room_id = p_room_id and currency_code = p_currency and is_active
    and (effective_from is null or effective_from <= p_check_in)
    and (effective_until is null or effective_until >= p_check_in);
  if v_base is null or v_base <= 0 then
    raise exception 'No active % rate configured for this room', p_currency;
  end if;
  select coalesce(discount_percent, 0) into v_discount from public.rate_plans where id = p_rate_plan_id;

  for d in select generate_series(p_check_in, p_check_out - 1, interval '1 day')::date loop
    select sp.price into v_price
    from public.seasonal_prices sp
    where sp.room_id = p_room_id
      and sp.currency_code = p_currency
      and (sp.rate_plan_id is null or sp.rate_plan_id = p_rate_plan_id)
      and sp.start_date <= d and sp.end_date > d
    order by (sp.rate_plan_id is null) asc
    limit 1;
    v_total := v_total + coalesce(v_price, v_base);
  end loop;

  return round(v_total * (100 - v_discount) / 100, 2);
end $$;

-- Server-side quote (no side effects)
create or replace function public.quote_booking(
  p_room_id uuid, p_rate_plan_id uuid, p_check_in date, p_check_out date,
  p_currency char(3) default 'EUR', p_adults int default 1, p_children int default 0
) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_plan public.rate_plans%rowtype;
  v_nights int;
  v_total numeric;
begin
  if p_check_out <= p_check_in then
    return jsonb_build_object('available', false, 'error', 'Invalid dates');
  end if;
  if p_currency not in ('EUR','ALL') then
    return jsonb_build_object('available', false, 'error', 'Unsupported currency');
  end if;
  select * into v_plan from public.rate_plans where id = p_rate_plan_id and active = true;
  if not found then
    return jsonb_build_object('available', false, 'error', 'Invalid rate plan');
  end if;
  v_nights := p_check_out - p_check_in;
  if v_nights < v_plan.min_stay then
    return jsonb_build_object('available', false, 'error', 'Minimum stay is ' || v_plan.min_stay || ' night(s)');
  end if;
  if p_adults + coalesce(p_children, 0) > (select capacity from public.hotel_rooms where id = p_room_id) then
    return jsonb_build_object('available', false, 'error', 'Guest count exceeds room capacity');
  end if;
  if not public.is_room_available(p_room_id, p_check_in, p_check_out) then
    return jsonb_build_object('available', false, 'error', 'Not available for selected dates');
  end if;
  begin
    v_total := public.calculate_booking_price(p_room_id, p_rate_plan_id, p_currency, p_check_in, p_check_out);
  exception when others then
    return jsonb_build_object('available', false, 'error', SQLERRM);
  end;
  return jsonb_build_object(
    'available', true,
    'nights', v_nights,
    'currency', p_currency,
    'total_price', v_total,
    'deposit_amount', round(v_total * v_plan.deposit_percent / 100, 2),
    'balance_due', round(v_total * (100 - v_plan.deposit_percent) / 100, 2),
    'discount_percent', v_plan.discount_percent
  );
end $$;

-- Atomic booking creation: room-row lock prevents concurrent overbooking.
-- Creates 'request' (no deposit) or 'hold' (deposit required, auto-expires).
-- NEVER marks anything confirmed/paid — that is staff or verified-webhook only.
create or replace function public.create_booking(
  p_room_id uuid,
  p_rate_plan_id uuid,
  p_check_in date,
  p_check_out date,
  p_adults int,
  p_children int,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text default null,
  p_special_requests text default null,
  p_currency char(3) default 'EUR',
  p_accepted_terms boolean default false,
  p_source text default 'direct'
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_room public.hotel_rooms%rowtype;
  v_plan public.rate_plans%rowtype;
  v_policy public.hotel_cancellation_policies%rowtype;
  v_nights int;
  v_total numeric;
  v_deposit numeric;
  v_status text;
  v_id uuid;
  v_code text;
  v_guest_id uuid;
  v_snapshot jsonb;
begin
  if p_check_out <= p_check_in then
    raise exception 'Invalid dates: check-out must be after check-in';
  end if;
  if not p_accepted_terms then
    raise exception 'You must accept the booking terms to continue';
  end if;
  if p_guest_name is null or length(trim(p_guest_name)) < 2 then
    raise exception 'Guest name is required';
  end if;
  if p_guest_email is null or p_guest_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'A valid email is required';
  end if;
  if p_currency not in ('EUR','ALL') then
    raise exception 'Unsupported currency';
  end if;

  -- Expire abandoned holds so inventory returns to sale
  update public.hotel_bookings
  set status = 'cancelled', cancelled_at = now(), cancellation_reason = 'Payment hold expired', updated_at = now()
  where status = 'hold' and expires_at < now();

  if (select count(*) from public.hotel_bookings
      where guest_email = lower(trim(p_guest_email)) and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many booking attempts. Please contact us directly.';
  end if;

  select * into v_room from public.hotel_rooms where id = p_room_id and active = true for update;
  if not found then raise exception 'Room not found or inactive'; end if;

  select * into v_plan from public.rate_plans where id = p_rate_plan_id and active = true;
  if not found then raise exception 'Rate plan not found or inactive'; end if;

  if not public.is_room_available(p_room_id, p_check_in, p_check_out) then
    raise exception 'Selected dates are not available for this room';
  end if;

  v_nights := p_check_out - p_check_in;
  if v_nights < v_plan.min_stay then
    raise exception 'Minimum stay for this rate plan is % night(s)', v_plan.min_stay;
  end if;

  v_total := public.calculate_booking_price(p_room_id, p_rate_plan_id, p_currency, p_check_in, p_check_out);
  if v_total <= 0 then raise exception 'Could not calculate price'; end if;

  v_deposit := round(v_total * v_plan.deposit_percent / 100, 2);
  v_status := case when v_plan.deposit_percent > 0 then 'hold' else 'request' end;

  select * into v_policy from public.hotel_cancellation_policies where id = v_plan.cancellation_policy_id;

  v_snapshot := jsonb_build_object(
    'rate_plan', jsonb_build_object(
      'code', v_plan.code, 'name_en', v_plan.name_en, 'name_el', v_plan.name_el,
      'refundable', v_plan.refundable, 'discount_percent', v_plan.discount_percent,
      'deposit_percent', v_plan.deposit_percent, 'deposit_amount', v_deposit,
      'balance_due', v_plan.balance_due, 'min_stay', v_plan.min_stay
    ),
    'cancellation_policy', case when v_policy.id is not null then jsonb_build_object(
      'name', v_policy.name, 'version', v_policy.version,
      'free_cancel_before_hours', v_policy.free_cancel_before_hours,
      'late_cancel_penalty_type', v_policy.late_cancel_penalty_type,
      'late_cancel_penalty_percent', v_policy.late_cancel_penalty_percent,
      'no_show_penalty_type', v_policy.no_show_penalty_type,
      'no_show_penalty_percent', v_policy.no_show_penalty_percent,
      'non_refundable', v_policy.non_refundable
    ) else '{}'::jsonb end,
    'price', jsonb_build_object(
      'currency', p_currency, 'nights', v_nights,
      'total', v_total, 'deposit', v_deposit
    ),
    'tax', (select jsonb_build_object('label', tax_label, 'rate', tax_rate, 'included', taxes_included)
            from public.hotel_house_policies limit 1),
    'accepted_terms_at', now(),
    'snapshot_at', now()
  );

  insert into public.guests (email, full_name, phone)
  values (lower(trim(p_guest_email)), trim(p_guest_name), p_guest_phone)
  on conflict (email) do update set
    full_name = excluded.full_name,
    phone = coalesce(excluded.phone, guests.phone),
    updated_at = now()
  returning id into v_guest_id;

  insert into public.hotel_bookings (
    guest_id, room_id, rate_plan_id, guest_name, guest_email, guest_phone,
    check_in, check_out, adults, children, guests, total_price, currency_code,
    deposit_amount, payment_due, payment_status, payment_mode, status,
    cancellation_policy_snapshot, accepted_terms_version, accepted_terms_at,
    special_requests, source, expires_at
  ) values (
    v_guest_id, p_room_id, p_rate_plan_id, trim(p_guest_name), lower(trim(p_guest_email)), p_guest_phone,
    p_check_in, p_check_out, p_adults, p_children, p_adults + coalesce(p_children, 0), v_total, p_currency,
    v_deposit, case when v_deposit > 0 then v_deposit else v_total end,
    'unpaid',
    'pay_at_property', v_status,
    v_snapshot, 'terms-' || to_char(now(), 'YYYY-MM-DD'), now(),
    p_special_requests, p_source,
    case when v_status = 'hold' then now() + interval '30 minutes' else null end
  ) returning id, code into v_id, v_code;

  return jsonb_build_object(
    'booking_id', v_id,
    'code', v_code,
    'status', v_status,
    'currency', p_currency,
    'total_price', v_total,
    'deposit_amount', v_deposit,
    'balance_due', greatest(v_total - v_deposit, 0),
    'room_name_en', v_room.name_en,
    'room_name_el', v_room.name_el,
    'expires_at', case when v_status = 'hold' then now() + interval '30 minutes' else null end
  );
end $$;

-- Availability matrix for the staff calendar
create or replace function public.availability_matrix(p_from date, p_to date)
returns table (room_id uuid, room_name text, d date, booking_code text, status text, blocked boolean)
language sql security definer set search_path = public stable as $$
  select r.id, r.name_en, gs.d::date, b.code, b.status::text, false
  from public.hotel_rooms r
  cross join generate_series(p_from, p_to - 1, interval '1 day') gs(d)
  left join public.hotel_bookings b
    on b.room_id = r.id
    and b.status in ('hold','confirmed','checked_in')
    and (b.status <> 'hold' or b.expires_at > now())
    and b.check_in <= gs.d::date and b.check_out > gs.d::date
  where r.active = true
  union all
  select r.id, r.name_en, gs.d::date, null, null, true
  from public.hotel_rooms r
  cross join generate_series(p_from, p_to - 1, interval '1 day') gs(d)
  join public.blocked_dates bd
    on bd.room_id = r.id and bd.start_date <= gs.d::date and bd.end_date > gs.d::date
  where r.active = true
  order by 1, 3;
$$;

-- Room catalog write policies for staff (public active-read already exists from v1)
drop policy if exists "rooms: manager write" on public.hotel_rooms;
create policy "rooms: manager write" on public.hotel_rooms for insert to authenticated
  with check (private.has_hotel_role(array['owner','manager']));
drop policy if exists "rooms: manager update" on public.hotel_rooms;
create policy "rooms: manager update" on public.hotel_rooms for update to authenticated
  using (private.has_hotel_role(array['owner','manager'])) with check (private.has_hotel_role(array['owner','manager']));

-- Rate plans: public catalog read; staff manage
drop policy if exists rate_plans_public_active_read on public.rate_plans;
create policy rate_plans_public_active_read on public.rate_plans for select using (active = true);
drop policy if exists rate_plans_staff_read on public.rate_plans;
create policy rate_plans_staff_read on public.rate_plans for select to authenticated
  using (private.has_hotel_role(array['owner','manager','receptionist','accountant']));
drop policy if exists rate_plans_manager_manage on public.rate_plans;
create policy rate_plans_manager_manage on public.rate_plans for all to authenticated
  using (private.has_hotel_role(array['owner','manager'])) with check (private.has_hotel_role(array['owner','manager']));

-- ---------- Owner account (individual login; no shared admin) ----------
do $$
declare
  v_uid uuid;
begin
  select id into v_uid from auth.users where email = 'agapitosolgakalafata@gmail.com';
  if v_uid is null then
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      'agapitosolgakalafata@gmail.com', extensions.crypt('123456789', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Villa Memaj Owner"}', now(), now())
    returning id into v_uid;
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (v_uid::text, v_uid, jsonb_build_object('sub', v_uid::text, 'email', 'agapitosolgakalafata@gmail.com', 'email_verified', true), 'email', now(), now(), now())
    on conflict do nothing;
  else
    update auth.users set encrypted_password = extensions.crypt('123456789', extensions.gen_salt('bf')), updated_at = now() where id = v_uid;
  end if;

  insert into public.hotel_staff_memberships (user_id, role, is_active)
  values (v_uid, 'owner', true)
  on conflict (user_id) do update set role = 'owner', is_active = true;
end $$;

-- ---------- Grants ----------
grant execute on function public.create_booking to anon, authenticated;
grant execute on function public.quote_booking to anon, authenticated;
grant execute on function public.is_room_available to anon, authenticated;
grant execute on function public.calculate_booking_price to authenticated;
grant execute on function public.availability_matrix to authenticated;
grant select on public.guests to authenticated;
grant select on public.hotel_house_policies to anon, authenticated;
grant select on public.rate_plans to anon, authenticated;
grant select on public.hotel_room_rates to anon, authenticated;
