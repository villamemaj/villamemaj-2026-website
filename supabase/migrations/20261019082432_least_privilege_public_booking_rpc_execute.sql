-- Expose only the booking RPCs actually called by the public booking form.
-- Pricing/availability helpers are called internally by these SECURITY DEFINER entry points
-- and do not need direct execution privileges from the Data API.
revoke execute on function public.is_room_available(uuid, date, date) from public, anon, authenticated;
revoke execute on function public.calculate_booking_price(uuid, uuid, character, date, date) from public, anon, authenticated;

revoke execute on function public.quote_booking(uuid, uuid, date, date, character, integer, integer) from public, authenticated;
grant execute on function public.quote_booking(uuid, uuid, date, date, character, integer, integer) to anon;

revoke execute on function public.submit_booking_request(uuid, uuid, date, date, integer, integer, text, text, text, text, character, boolean, text, integer) from public, authenticated;
grant execute on function public.submit_booking_request(uuid, uuid, date, date, integer, integer, text, text, text, text, character, boolean, text, integer) to anon;
