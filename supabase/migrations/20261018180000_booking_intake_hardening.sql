-- Booking intake hardening.
-- Makes the database itself the server-side validation/rate-limit boundary for public
-- booking requests, then removes the unsafe direct-public-insert policy on hotel_bookings
-- (the cutover previously staged as 20261018140000_lockdown_public_booking_inserts.sql).
--
-- Why in-database instead of an Edge Function: the public intake must be a single
-- server-controlled path that validates input, prices from database rates, applies
-- rate limits and creates only a pending request. submit_booking_request() does exactly
-- that as a security-definer wrapper, so the browser never holds a privileged key and
-- anonymous callers can no longer touch create_booking or insert bookings directly.

-- 1. Attempt ledger used for throttling and abuse review -----------------------------
create table if not exists public.booking_intake_attempts (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  email_hash text,
  outcome text not null check (outcome in ('accepted', 'rejected', 'error')),
  reason text,
  message text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists booking_intake_attempts_ip_time_idx
  on public.booking_intake_attempts (ip_hash, created_at desc);
create index if not exists booking_intake_attempts_email_time_idx
  on public.booking_intake_attempts (email_hash, created_at desc);
create index if not exists booking_intake_attempts_time_idx
  on public.booking_intake_attempts (created_at desc);

alter table public.booking_intake_attempts enable row level security;
-- Intentionally no policies: only the security-definer intake path and the service role
-- may read or write this table.
revoke all on public.booking_intake_attempts from anon, authenticated;

-- 2. Public intake endpoint ----------------------------------------------------------
create or replace function public.submit_booking_request(
  p_room_id uuid,
  p_rate_plan_id uuid,
  p_check_in date,
  p_check_out date,
  p_adults int,
  p_children int,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text default null,
  p_special_requests text default null,
  p_currency char(3) default 'EUR',
  p_accepted_terms boolean default false,
  p_honeypot text default null,
  p_elapsed_ms int default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_headers jsonb;
  v_ip text;
  v_ua text;
  v_ip_hash text;
  v_email_hash text;
  v_recent_ip int;
  v_recent_email int;
  v_recent_global int;
  v_result jsonb;
begin
  -- Real client IP as recorded by the API gateway (not spoofable from the browser).
  begin
    v_headers := coalesce(current_setting('request.headers', true), '{}')::jsonb;
  exception when others then
    v_headers := '{}'::jsonb;
  end;

  v_ip := trim(split_part(coalesce(v_headers ->> 'x-forwarded-for', ''), ',', 1));
  if v_ip = '' then v_ip := 'unknown'; end if;
  v_ua := left(coalesce(v_headers ->> 'user-agent', ''), 200);

  v_ip_hash := md5(v_ip);
  v_email_hash := md5(lower(trim(coalesce(p_guest_email, ''))));

  -- Per-IP ceiling first so a single source cannot grow the ledger without bound.
  select count(*) into v_recent_ip
  from public.booking_intake_attempts
  where ip_hash = v_ip_hash and created_at > now() - interval '15 minutes';

  if v_recent_ip >= 8 then
    return jsonb_build_object('ok', false, 'reason', 'rate_limited');
  end if;

  -- Bot trap 1: hidden field that humans never see, let alone fill.
  if coalesce(trim(p_honeypot), '') <> '' then
    insert into public.booking_intake_attempts (ip_hash, email_hash, outcome, reason, user_agent)
    values (v_ip_hash, v_email_hash, 'rejected', 'honeypot', v_ua);
    return jsonb_build_object('ok', false, 'reason', 'rejected');
  end if;

  -- Bot trap 2: a real booking form is never completed in under a second.
  if p_elapsed_ms is not null and p_elapsed_ms < 1000 then
    insert into public.booking_intake_attempts (ip_hash, email_hash, outcome, reason, user_agent)
    values (v_ip_hash, v_email_hash, 'rejected', 'too_fast', v_ua);
    return jsonb_build_object('ok', false, 'reason', 'rejected');
  end if;

  -- Per-email and global ceilings (protect the property's inbox and inventory).
  select count(*) into v_recent_email
  from public.booking_intake_attempts
  where email_hash = v_email_hash and outcome = 'accepted' and created_at > now() - interval '24 hours';

  select count(*) into v_recent_global
  from public.booking_intake_attempts
  where outcome = 'accepted' and created_at > now() - interval '1 hour';

  if v_recent_email >= 3 or v_recent_global >= 100 then
    insert into public.booking_intake_attempts (ip_hash, email_hash, outcome, reason, user_agent)
    values (v_ip_hash, v_email_hash, 'rejected', 'rate_limited', v_ua);
    return jsonb_build_object('ok', false, 'reason', 'rate_limited');
  end if;

  -- Delegate to the validated, price-from-database booking creation.
  begin
    v_result := public.create_booking(
      p_room_id, p_rate_plan_id, p_check_in, p_check_out, p_adults, p_children,
      p_guest_name, p_guest_email, p_guest_phone, p_special_requests, p_currency,
      p_accepted_terms, 'direct'
    );
  exception when others then
    insert into public.booking_intake_attempts (ip_hash, email_hash, outcome, reason, message, user_agent)
    values (v_ip_hash, v_email_hash, 'error', 'invalid', sqlerrm, v_ua);
    return jsonb_build_object('ok', false, 'reason', 'invalid', 'message', sqlerrm);
  end;

  insert into public.booking_intake_attempts (ip_hash, email_hash, outcome, reason, user_agent)
  values (v_ip_hash, v_email_hash, 'accepted', 'ok', v_ua);

  return jsonb_build_object('ok', true, 'booking', v_result);
end $$;

-- 3. Cutover: only the hardened wrapper may create bookings from the public API -------
revoke execute on function public.create_booking from anon, authenticated;
grant execute on function public.submit_booking_request to anon, authenticated;

drop policy if exists "Anyone can submit a booking" on public.hotel_bookings;
