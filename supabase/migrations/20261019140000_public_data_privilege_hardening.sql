-- Security hardening: minimize public column exposure and remove unused public write grants.
-- Public pages can read only explicit guest-facing policy fields. Staff read all policy fields via RLS.

revoke all privileges on table public.hotel_house_policies from public, anon, authenticated;
grant select, update on table public.hotel_house_policies to authenticated;
grant all privileges on table public.hotel_house_policies to service_role;

drop policy if exists house_policies_public_read on public.hotel_house_policies;
drop policy if exists house_policies_anon_read on public.hotel_house_policies;
drop policy if exists house_policies_authenticated_staff_read on public.hotel_house_policies;

create policy house_policies_anon_read
  on public.hotel_house_policies
  for select to anon
  using (true);

create policy house_policies_authenticated_staff_read
  on public.hotel_house_policies
  for select to authenticated
  using (private.has_hotel_role(array['owner','manager','receptionist','housekeeping','accountant']));

grant select (
  check_in_time,
  check_out_time,
  smoking_allowed,
  pets_allowed,
  children_allowed,
  parties_allowed,
  quiet_hours,
  tax_label,
  tax_rate,
  taxes_included,
  damage_deposit,
  terms_en,
  terms_el,
  privacy_en,
  privacy_el,
  house_rules_en,
  house_rules_el,
  children_policy,
  child_rates_configured,
  cots_available,
  extra_beds_available,
  guest_address_required,
  guest_phone_required,
  minimum_check_in_age,
  curfew,
  internet_information,
  parking_information,
  damage_policy,
  additional_fees_note,
  accepted_payment_methods,
  monthly_stays_allowed,
  max_stay_nights,
  public_review_url
) on public.hotel_house_policies to anon;

-- Public guests only need to read the public room catalogue and active gallery.
-- The row policies continue to filter inactive rooms/images.
revoke all privileges on table public.hotel_rooms from public, anon, authenticated;
grant select on table public.hotel_rooms to anon, authenticated;
grant insert, update on table public.hotel_rooms to authenticated;
grant all privileges on table public.hotel_rooms to service_role;

revoke all privileges on table public.hotel_gallery_images from public, anon, authenticated;
grant select on table public.hotel_gallery_images to anon, authenticated;
grant all privileges on table public.hotel_gallery_images to service_role;

-- Re-assert service-only access to delivery queues and booking intake anti-abuse records.
revoke all privileges on table public.email_outbox, public.sms_outbox, public.owner_notification_outbox,
  public.booking_intake_attempts, public.support_rate_limits
  from public, anon, authenticated;
grant all privileges on table public.email_outbox, public.sms_outbox, public.owner_notification_outbox,
  public.booking_intake_attempts, public.support_rate_limits to service_role;

