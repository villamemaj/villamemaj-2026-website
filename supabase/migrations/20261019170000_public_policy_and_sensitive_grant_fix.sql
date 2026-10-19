-- Correct public property-policy column grants, remove broad authenticated
-- grants that can expose owner notification recipients, and revoke legacy public
-- table grants from private guest/audit/staff records.

revoke all privileges on table public.hotel_house_policies from authenticated;
do $block$
declare
  v_row record;
begin
  for v_row in
    select distinct column_name, privilege_type
    from information_schema.column_privileges
    where table_schema = 'public'
      and table_name = 'hotel_house_policies'
      and grantee = 'authenticated'
      and privilege_type in ('SELECT', 'INSERT', 'UPDATE')
  loop
    execute format(
      'REVOKE %s (%I) ON TABLE public.hotel_house_policies FROM authenticated',
      v_row.privilege_type, v_row.column_name
    );
  end loop;
end
$block$;

-- The guest-facing website reads only these columns. No internal notification
-- recipients, audit metadata or staff identifiers are included.
grant select (
  contact_email,
  contact_phone,
  address_en,
  address_el,
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
  extra_fees,
  terms_el,
  terms_en,
  privacy_el,
  privacy_en,
  house_rules_el,
  house_rules_en,
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
  public_review_url,
  damage_deposit_currency,
  arrival_instructions_en,
  arrival_instructions_el,
  local_guide_en,
  local_guide_el
) on public.hotel_house_policies to anon;

-- Authenticated hotel staff can read the same public-facing settings, and owners /
-- managers can edit only the operational configuration columns used by CRM forms.
grant select (
  id,
  contact_email,
  contact_phone,
  address_en,
  address_el,
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
  extra_fees,
  terms_el,
  terms_en,
  privacy_el,
  privacy_en,
  house_rules_el,
  house_rules_en,
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
  public_review_url,
  damage_deposit_currency,
  arrival_instructions_en,
  arrival_instructions_el,
  local_guide_en,
  local_guide_el
) on public.hotel_house_policies to authenticated;

grant update (
  contact_email,
  contact_phone,
  address_en,
  address_el,
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
  extra_fees,
  terms_el,
  terms_en,
  privacy_el,
  privacy_en,
  house_rules_el,
  house_rules_en,
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
  public_review_url,
  damage_deposit_currency,
  arrival_instructions_en,
  arrival_instructions_el,
  local_guide_en,
  local_guide_el
) on public.hotel_house_policies to authenticated;

-- Legacy anonymous table grants are unnecessary for private guest, audit and staff data.
revoke all privileges on table public.guests, public.hotel_audit_log, public.hotel_staff_memberships
  from public, anon;

do $block$
declare
  v_row record;
  v_grantee text;
begin
  for v_row in
    select table_name, grantee, column_name
    from information_schema.column_privileges
    where table_schema = 'public'
      and table_name in ('guests', 'hotel_audit_log', 'hotel_staff_memberships')
      and grantee in ('PUBLIC', 'anon')
  loop
    v_grantee := case when v_row.grantee = 'PUBLIC' then 'PUBLIC' else quote_ident(v_row.grantee) end;
    execute format(
      'REVOKE ALL PRIVILEGES (%I) ON TABLE public.%I FROM %s',
      v_row.column_name, v_row.table_name, v_grantee
    );
  end loop;
end
$block$;
