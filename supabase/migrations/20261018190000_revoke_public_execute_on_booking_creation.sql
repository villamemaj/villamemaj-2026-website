-- Corrects the booking-intake lockdown.
--
-- PostgreSQL grants EXECUTE on a new function to PUBLIC by default, so revoking only from
-- anon/authenticated (as 20261018180000 did) left create_booking callable by the public
-- API. Privileges must be revoked from PUBLIC. Verified: an anonymous direct call now
-- returns 42501 permission denied while submit_booking_request still works.

-- create_booking is reachable only through the hardened wrapper (security definer, so it
-- still calls this) and explicitly authorised server-side roles.
revoke all on function public.create_booking from public;
grant execute on function public.create_booking to service_role;

-- Staff/admin RPCs guard themselves with role checks, but anonymous clients have no
-- business reaching them at all; they read auth.users and manage accounts.
revoke all on function public.admin_create_staff from public;
revoke all on function public.admin_set_staff_role from public;
revoke all on function public.admin_set_staff_active from public;
revoke all on function public.admin_list_staff from public;
revoke all on function public.calculate_booking_price from public;
revoke all on function public.availability_matrix from public;

grant execute on function public.admin_create_staff to authenticated, service_role;
grant execute on function public.admin_set_staff_role to authenticated, service_role;
grant execute on function public.admin_set_staff_active to authenticated, service_role;
grant execute on function public.admin_list_staff to authenticated, service_role;
grant execute on function public.calculate_booking_price to authenticated, service_role;
grant execute on function public.availability_matrix to authenticated, service_role;
