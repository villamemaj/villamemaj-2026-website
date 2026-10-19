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

-- A checkout review link reveals no booking details and expires only by being rotated.
alter table public.hotel_bookings
  add column if not exists review_token uuid not null default gen_random_uuid();
create unique index if not exists hotel_bookings_review_token_key
  on public.hotel_bookings(review_token);

-- Booking-linked testimonials reuse the existing consent/moderation table.
alter table public.guest_testimonials
  add column if not exists booking_id uuid references public.hotel_bookings(id) on delete set null,
  add column if not exists moderation_status text not null default 'pending'
    check (moderation_status in ('pending','published','rejected'));
create unique index if not exists guest_testimonials_booking_id_key
  on public.guest_testimonials(booking_id) where booking_id is not null;
update public.guest_testimonials
set moderation_status = case when is_published and consent_to_publish then 'published' else 'pending' end;

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


-- Extend the existing scheduled post-checkout message to include the unique first-party review form.
-- Dynamic replace preserves the rest of the live lifecycle function unchanged.
do $review_link_patch$
declare
  definition text;
  old_fragment text := $$'If you wish to leave a public review, use the property review link: ' || v_cfg.public_review_url;$$;
  new_fragment text := $$'If you wish to leave a public review, use the property review link: ' || v_cfg.public_review_url;
      v_body := v_body || E'\n' || 'Share feedback with Villa Memaj: https://villamemaj-2026-website.vercel.app/en/review?token=' || b.review_token::text;$$;
begin
  select pg_get_functiondef('public.queue_guest_lifecycle_messages()'::regprocedure) into definition;
  if position(new_fragment in definition) > 0 then
    return;
  end if;
  if position(old_fragment in definition) = 0 then
    raise exception 'Expected review-link fragment not found in queue_guest_lifecycle_messages()';
  end if;
  execute replace(definition, old_fragment, new_fragment);
end
$review_link_patch$;
