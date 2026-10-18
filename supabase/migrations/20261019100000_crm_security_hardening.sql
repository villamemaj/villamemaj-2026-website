-- CRM security hardening: the calendar RPC bypasses table RLS by design,
-- so enforce staff authorization and bound the requested date range here.
create or replace function public.availability_matrix(p_from date, p_to date)
returns table (room_id uuid, room_name text, d date, booking_code text, status text, blocked boolean)
language plpgsql
security definer
set search_path = public
as $function$
begin
  if not private.has_hotel_role(array['owner','manager','receptionist','housekeeping']) then
    raise exception 'Not authorized to view the availability matrix' using errcode = '42501';
  end if;

  if p_from is null or p_to is null or p_to <= p_from or p_to > p_from + 366 then
    raise exception 'Invalid calendar range; choose between 1 and 366 days' using errcode = '22023';
  end if;

  return query
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
  select r.id, r.name_en, gs.d::date, null::text, null::text, true
  from public.hotel_rooms r
  cross join generate_series(p_from, p_to - 1, interval '1 day') gs(d)
  join public.blocked_dates bd
    on bd.room_id = r.id and bd.start_date <= gs.d::date and bd.end_date > gs.d::date
  where r.active = true
  order by 1, 3;
end
$function$;
