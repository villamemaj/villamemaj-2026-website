-- Compatibility additions for the live Villa Memaj database.
-- Reuse existing guest_support_conversations, guest_support_messages, guest_testimonials,
-- email_outbox and sms_outbox. Do not create a parallel support/review schema.

alter table public.hotel_house_policies
  add column if not exists arrival_instructions_en text not null default '',
  add column if not exists arrival_instructions_el text not null default '',
  add column if not exists local_guide_en text not null default '',
  add column if not exists local_guide_el text not null default '',
  add column if not exists damage_deposit_currency text not null default 'EUR'
    check (damage_deposit_currency in ('EUR','ALL'));

alter table public.guest_support_conversations
  add column if not exists guest_name text,
  add column if not exists guest_phone text;

-- The public site may read only explicit guest-facing policy columns.
-- In particular, notification_emails and updated_by remain private.
revoke all on public.hotel_house_policies from anon;
grant select (
  contact_email, contact_phone, address_el, address_en,
  check_in_time, check_out_time, smoking_allowed, pets_allowed, children_allowed,
  parties_allowed, quiet_hours, tax_label, tax_rate, taxes_included, damage_deposit,
  terms_el, terms_en, privacy_el, privacy_en, house_rules_el, house_rules_en,
  children_policy, child_rates_configured, cots_available, extra_beds_available,
  guest_address_required, guest_phone_required, minimum_check_in_age, curfew,
  internet_information, parking_information, damage_policy, additional_fees_note,
  accepted_payment_methods, monthly_stays_allowed, max_stay_nights,
  public_review_url, arrival_instructions_en, arrival_instructions_el, local_guide_en, local_guide_el
) on public.hotel_house_policies to anon;

-- Public policies are row-filtered by the existing RLS policy; server-only email
-- and SMS outboxes remain inaccessible to anon/authenticated roles.
