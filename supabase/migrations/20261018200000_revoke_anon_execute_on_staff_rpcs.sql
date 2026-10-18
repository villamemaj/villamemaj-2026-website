-- Follow-up to 20261018190000.
--
-- Supabase ships ALTER DEFAULT PRIVILEGES in schema public that grant EXECUTE to
-- anon/authenticated/service_role on every newly created function. Revoking from PUBLIC
-- therefore does not remove the explicit anon grant. Each staff-only RPC needs an explicit
-- revoke from anon, or it stays callable by anonymous API clients.
--
-- Most important: availability_matrix() reveals booking codes, statuses and occupancy for
-- an arbitrary date range, which must never be readable by anonymous callers.

revoke all on function public.admin_create_staff from anon;
revoke all on function public.admin_set_staff_role from anon;
revoke all on function public.admin_set_staff_active from anon;
revoke all on function public.admin_list_staff from anon;
revoke all on function public.calculate_booking_price from anon;
revoke all on function public.availability_matrix from anon;
