-- Expand the central property-settings record to model the policy sections
-- typically maintained in the accommodation Extranet. All values remain editable by
-- owner/manager staff under the existing hotel_house_policies RLS policy.
alter table public.hotel_house_policies
  add column if not exists children_policy text not null default 'Children of any age are allowed.',
  add column if not exists child_rates_configured boolean not null default false,
  add column if not exists cots_available boolean not null default false,
  add column if not exists extra_beds_available boolean not null default false,
  add column if not exists guest_address_required boolean not null default false,
  add column if not exists guest_phone_required boolean not null default true,
  add column if not exists minimum_check_in_age integer,
  add column if not exists curfew text not null default '',
  add column if not exists internet_information text not null default 'Wi-Fi is available in public areas and is free of charge.',
  add column if not exists parking_information text not null default 'Parking information refers to public-street parking; a space is not reserved or guaranteed.',
  add column if not exists damage_policy text not null default '',
  add column if not exists additional_fees_note text not null default '',
  add column if not exists accepted_payment_methods jsonb not null default '["cash"]'::jsonb,
  add column if not exists monthly_stays_allowed boolean not null default true,
  add column if not exists max_stay_nights integer not null default 90 check (max_stay_nights between 1 and 365);

-- Align the central settings to the current property information supplied by the owner.
-- This is an intentional property-policy data change, kept inside the reviewed migration.
update public.hotel_house_policies
set
  check_in_time = '12:00–23:00',
  check_out_time = '08:00–10:00',
  smoking_allowed = true,
  pets_allowed = false,
  children_allowed = true,
  parties_allowed = false,
  quiet_hours = '',
  children_policy = 'Children of any age are allowed.',
  child_rates_configured = false,
  cots_available = false,
  extra_beds_available = false,
  guest_address_required = false,
  guest_phone_required = true,
  minimum_check_in_age = null,
  curfew = '',
  internet_information = 'Wi-Fi is available in public areas and is free of charge.',
  parking_information = 'Parking information refers to public-street parking; a space is not reserved or guaranteed.',
  damage_policy = '',
  accepted_payment_methods = '["cash"]'::jsonb,
  monthly_stays_allowed = true,
  max_stay_nights = 90,
  house_rules_en = '',
  house_rules_el = '',
  updated_at = now()
where id = '00000000-0000-0000-0000-000000000001';

-- The new policy fields describe property-facing settings. Do not add private guest,
-- payment credential or staff-only notes to this publicly readable row.;
