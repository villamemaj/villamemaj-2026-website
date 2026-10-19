-- Fix the public-policy column grants after the initial privilege-hardening
-- migration gained more guest-facing fields. Also remove legacy anonymous table
-- grants from private guest, audit and staff-membership tables.

grant select (
  contact_email,
  contact_phone,
  address_en,
  address_el,
  damage_deposit_currency,
  arrival_instructions_en,
  arrival_instructions_el,
  local_guide_en,
  local_guide_el,
  public_review_url
) on public.hotel_house_policies to anon;

-- Owner notification destinations are private operational data and must not be
-- selectable by ordinary authenticated staff, even when a staff RLS policy grants
-- access to the public property-settings row. The owner-alert worker uses service_role.
revoke select (notification_emails) on public.hotel_house_policies from authenticated;
revoke update (notification_emails) on public.hotel_house_policies from authenticated;

revoke all privileges on table public.guests, public.hotel_audit_log, public.hotel_staff_memberships
  from public, anon;

-- Remove column-level grants too, if any were added separately in the past.
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
