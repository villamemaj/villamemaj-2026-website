-- Email notifications: queued in the database, sent by a dispatcher that only needs a
-- provider key.
--
-- Design: the queue lives in Postgres and is filled by a trigger on hotel_bookings, so no
-- booking path can forget to notify anyone. Delivery happens out-of-band by
-- /api/email/dispatch, which claims a batch, sends it through the configured provider and
-- records the result with retry/backoff. Until a provider key exists, mail simply stays
-- queued and is visible to staff in the CRM.

-- 1. Contact / notification settings on the singleton settings row ---------------------
alter table public.hotel_house_policies
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists notification_emails text[] not null default '{}';

-- Placeholders to be confirmed by the owner (public contact vs internal alert inbox).
update public.hotel_house_policies
set contact_email = coalesce(contact_email, 'info@villamemaj.com'),
    contact_phone = coalesce(contact_phone, '+355 69 000 0000'),
    notification_emails = case
      when coalesce(array_length(notification_emails, 1), 0) = 0
        then array['agapitosolgakalafata@gmail.com']
      else notification_emails
    end;

-- 2. Outbox ---------------------------------------------------------------------------
create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.hotel_bookings(id) on delete cascade,
  kind text not null,
  to_email text not null,
  to_name text,
  subject text not null,
  body_text text not null,
  status text not null default 'pending'
    check (status in ('pending', 'sending', 'sent', 'failed', 'skipped')),
  attempts int not null default 0,
  last_error text,
  provider text,
  provider_message_id text,
  scheduled_for timestamptz not null default now(),
  claimed_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists email_outbox_queue_idx
  on public.email_outbox (status, scheduled_for);
create index if not exists email_outbox_booking_idx
  on public.email_outbox (booking_id);

alter table public.email_outbox enable row level security;
revoke all on public.email_outbox from anon, authenticated;

-- 3. Enqueue on booking request -------------------------------------------------------
create or replace function public.enqueue_booking_emails() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_cfg public.hotel_house_policies%rowtype;
  v_room_en text;
  v_room_el text;
  v_nights int;
  v_total text;
  v_deposit text;
  v_balance text;
  v_guest_body text;
  v_owner_body text;
  v_recipients text[];
  r text;
begin
  if new.status not in ('request', 'hold') then
    return new;
  end if;

  select * into v_cfg from public.hotel_house_policies limit 1;
  select name_en, name_el into v_room_en, v_room_el
  from public.hotel_rooms where id = new.room_id;

  v_nights := coalesce(new.nights, new.check_out - new.check_in);
  v_total := to_char(coalesce(new.total_price, 0), 'FM9999999990.00');
  v_deposit := to_char(coalesce(new.deposit_amount, 0), 'FM9999999990.00');
  v_balance := to_char(coalesce(new.balance_due, 0), 'FM9999999990.00');

  -- Guest acknowledgement (bilingual: the site is EL/EN)
  v_guest_body :=
    'Thank you for your booking request.' || E'\n' ||
    'Ευχαριστούμε για το αίτημα κράτησής σας.' || E'\n\n' ||
    'Reference / Κωδικός: ' || new.code || E'\n' ||
    'Room / Δωμάτιο: ' || coalesce(v_room_en, '') || ' — ' || coalesce(v_room_el, '') || E'\n' ||
    'Dates / Ημερομηνίες: ' || new.check_in || ' → ' || new.check_out ||
      ' (' || v_nights || ' nights / νύχτες)' || E'\n' ||
    'Guests / Άτομα: ' || new.adults || ' adults, ' || coalesce(new.children, 0) || ' children' || E'\n' ||
    'Total / Σύνολο: ' || new.currency_code || ' ' || v_total || E'\n' ||
    'Deposit / Προκαταβολή: ' || new.currency_code || ' ' || v_deposit || E'\n' ||
    'Balance on arrival / Υπόλοιπο στην άφιξη: ' || new.currency_code || ' ' || v_balance || E'\n\n' ||
    'This is a request, not yet a confirmed booking. We will contact you to confirm availability and payment.' || E'\n' ||
    'Αυτό είναι αίτημα, όχι ακόμη επιβεβαιωμένη κράτηση. Θα επικοινωνήσουμε μαζί σας για επιβεβαίωση.' || E'\n\n' ||
    coalesce(v_cfg.contact_email, '') || ' · ' || coalesce(v_cfg.contact_phone, '');

  insert into public.email_outbox (booking_id, kind, to_email, to_name, subject, body_text)
  values (new.id, 'booking_guest_ack', new.guest_email, new.guest_name,
          'Booking request ' || new.code || ' received / Λάβαμε το αίτημά σας',
          v_guest_body);

  -- Owner/staff alert
  v_owner_body :=
    'New booking request' || E'\n\n' ||
    'Reference: ' || new.code || E'\n' ||
    'Status: ' || new.status ||
      case when new.expires_at is not null
        then ' (hold expires ' || to_char(new.expires_at, 'YYYY-MM-DD HH24:MI') || ')' else '' end || E'\n' ||
    'Guest: ' || new.guest_name || ' <' || new.guest_email || '>' ||
      case when nullif(new.guest_phone, '') is not null then ' ' || new.guest_phone else '' end || E'\n' ||
    'Room: ' || coalesce(v_room_en, '') || ' — ' || coalesce(v_room_el, '') || E'\n' ||
    'Dates: ' || new.check_in || ' → ' || new.check_out || ' (' || v_nights || ' nights)' || E'\n' ||
    'Guests: ' || new.adults || ' adults, ' || coalesce(new.children, 0) || ' children' || E'\n' ||
    'Total: ' || new.currency_code || ' ' || v_total ||
      '   Deposit: ' || new.currency_code || ' ' || v_deposit ||
      '   Balance: ' || new.currency_code || ' ' || v_balance || E'\n' ||
    'Source: ' || coalesce(new.source, 'direct') || E'\n' ||
    'Requests: ' || coalesce(nullif(new.special_requests, ''), '—') || E'\n\n' ||
    'Open in CRM: /admin/reservations/' || new.id;

  v_recipients := coalesce(
    nullif(v_cfg.notification_emails, '{}'),
    array[coalesce(v_cfg.contact_email, '')]
  );

  foreach r in array v_recipients loop
    if coalesce(trim(r), '') <> '' then
      insert into public.email_outbox (booking_id, kind, to_email, to_name, subject, body_text)
      values (new.id, 'booking_owner_alert', r, null,
              'New booking request ' || new.code || ' — ' || coalesce(v_room_en, ''),
              v_owner_body);
    end if;
  end loop;

  return new;
end $$;

drop trigger if exists hotel_bookings_enqueue_emails on public.hotel_bookings;
create trigger hotel_bookings_enqueue_emails
  after insert on public.hotel_bookings
  for each row execute function public.enqueue_booking_emails();

-- 4. Dispatcher support ---------------------------------------------------------------
create or replace function public.claim_outbox_emails(p_limit int default 20)
returns setof public.email_outbox
language plpgsql security definer set search_path = public as $$
begin
  -- Reclaim anything a crashed dispatcher left mid-flight.
  update public.email_outbox
  set status = 'pending'
  where status = 'sending' and claimed_at < now() - interval '10 minutes';

  return query
  with batch as (
    select id from public.email_outbox
    where status = 'pending' and scheduled_for <= now()
    order by scheduled_for
    limit greatest(1, least(coalesce(p_limit, 20), 100))
    for update skip locked
  )
  update public.email_outbox e
  set status = 'sending', attempts = e.attempts + 1, claimed_at = now()
  from batch b
  where e.id = b.id
  returning e.*;
end $$;

create or replace function public.finish_outbox_email(
  p_id uuid,
  p_ok boolean,
  p_provider text default null,
  p_message_id text default null,
  p_error text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_ok then
    update public.email_outbox
    set status = 'sent',
        sent_at = now(),
        provider = coalesce(p_provider, provider),
        provider_message_id = p_message_id,
        last_error = null
    where id = p_id;
  else
    -- Exponential-ish backoff, give up after 5 attempts (stays visible as 'failed').
    update public.email_outbox
    set status = case when attempts >= 5 then 'failed' else 'pending' end,
        last_error = left(coalesce(p_error, 'unknown error'), 500),
        provider = coalesce(p_provider, provider),
        scheduled_for = now() + make_interval(mins => least(60, attempts * attempts * 2))
    where id = p_id;
  end if;
end $$;

-- Staff-visible view of the queue (the CRM "Notifications" page).
create or replace function public.admin_list_outbox(p_limit int default 100)
returns table (
  id uuid, booking_id uuid, kind text, to_email text, subject text, status text,
  attempts int, last_error text, scheduled_for timestamptz, sent_at timestamptz, created_at timestamptz
)
language sql security definer set search_path = public stable as $$
  select e.id, e.booking_id, e.kind, e.to_email, e.subject, e.status,
         e.attempts, e.last_error, e.scheduled_for, e.sent_at, e.created_at
  from public.email_outbox e
  where private.has_hotel_role(array['owner', 'manager'])
  order by e.created_at desc
  limit greatest(1, least(coalesce(p_limit, 100), 500));
$$;

-- 5. Privileges ----------------------------------------------------------------------
revoke all on function public.enqueue_booking_emails() from public, anon, authenticated;
revoke all on function public.claim_outbox_emails(int) from public, anon, authenticated;
revoke all on function public.finish_outbox_email(uuid, boolean, text, text, text) from public, anon, authenticated;
revoke all on function public.admin_list_outbox(int) from public, anon;

grant execute on function public.claim_outbox_emails(int) to service_role;
grant execute on function public.finish_outbox_email(uuid, boolean, text, text, text) to service_role;
grant execute on function public.admin_list_outbox(int) to authenticated, service_role;
