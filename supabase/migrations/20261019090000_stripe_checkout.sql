-- Stripe Checkout integration: add provider support and idempotent webhook reconciliation.
-- Stripe keys remain deployment secrets; this migration contains no credentials.

alter table public.hotel_payment_transactions
  drop constraint if exists hotel_payment_transactions_provider_check;
alter table public.hotel_payment_transactions
  add constraint hotel_payment_transactions_provider_check
  check (provider in ('bkt_vpos', 'stripe', 'manual', 'other'));

alter table public.hotel_payment_webhook_events
  drop constraint if exists hotel_payment_webhook_events_provider_check;
alter table public.hotel_payment_webhook_events
  add constraint hotel_payment_webhook_events_provider_check
  check (provider in ('bkt_vpos', 'stripe', 'other'));

-- Trigger-only functions should not be directly callable over the PostgREST RPC API.
revoke all on function public.hotel_audit_changes() from public, anon, authenticated;
revoke all on function public.refresh_booking_payment() from public, anon, authenticated;

create or replace function public.apply_stripe_checkout_event(
  p_provider_event_id text,
  p_event_type text,
  p_transaction_id uuid,
  p_booking_id uuid,
  p_session_id text,
  p_payment_intent_id text,
  p_amount_minor bigint,
  p_currency text,
  p_outcome text,
  p_payload_sha256 text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_inserted uuid;
  v_tx public.hotel_payment_transactions%rowtype;
  v_booking public.hotel_bookings%rowtype;
  v_status text;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role required' using errcode = '42501';
  end if;
  if p_provider_event_id is null or length(p_provider_event_id) < 5
     or p_session_id is null or p_transaction_id is null or p_booking_id is null then
    raise exception 'Incomplete Stripe event metadata' using errcode = '22023';
  end if;
  if p_outcome not in ('succeeded', 'failed', 'cancelled', 'pending') then
    raise exception 'Unsupported Stripe event outcome' using errcode = '22023';
  end if;

  insert into public.hotel_payment_webhook_events
    (provider, provider_event_id, payload_sha256, status, attempts, received_at)
  values ('stripe', p_provider_event_id, p_payload_sha256, 'received', 1, now())
  on conflict (provider, provider_event_id) do nothing
  returning id into v_inserted;

  if v_inserted is null then
    return jsonb_build_object('ok', true, 'duplicate', true);
  end if;

  select * into v_tx
  from public.hotel_payment_transactions
  where id = p_transaction_id
  for update;

  if not found or v_tx.provider <> 'stripe' or v_tx.booking_id <> p_booking_id
     or v_tx.provider_transaction_id <> p_session_id then
    raise exception 'Stripe session does not match the payment ledger' using errcode = '22023';
  end if;

  select * into v_booking
  from public.hotel_bookings
  where id = p_booking_id
  for update;
  if not found then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;

  if upper(coalesce(p_currency, '')) <> upper(v_tx.currency_code::text) then
    raise exception 'Stripe currency does not match the ledger' using errcode = '22023';
  end if;
  if p_amount_minor is null or p_amount_minor <> round(v_tx.amount * 100)::bigint then
    raise exception 'Stripe amount does not match the ledger' using errcode = '22023';
  end if;

  if v_tx.status = 'succeeded' then
    v_status := 'processed';
  elsif p_outcome = 'succeeded' then
    update public.hotel_payment_transactions
    set status = 'succeeded',
        processed_at = now(),
        failure_code = null,
        notes = left(concat_ws(E'\n', nullif(notes, ''), 'Stripe event: ' || p_event_type,
          case when p_payment_intent_id is not null then 'PaymentIntent: ' || p_payment_intent_id else null end), 2000)
    where id = v_tx.id;
    -- The existing refresh_booking_payment trigger recalculates the ledger totals atomically.
    update public.hotel_bookings
    set status = case when status = 'hold' then 'confirmed' else status end,
        confirmed_at = case when status = 'hold' then coalesce(confirmed_at, now()) else confirmed_at end,
        updated_at = now()
    where id = p_booking_id and status in ('hold', 'confirmed');
    v_status := 'processed';
  elsif p_outcome = 'failed' and v_tx.status in ('initiated', 'pending') then
    update public.hotel_payment_transactions
    set status = 'failed', processed_at = now(), failure_code = 'stripe_async_payment_failed',
        notes = left(concat_ws(E'\n', nullif(notes, ''), 'Stripe event: ' || p_event_type), 2000)
    where id = v_tx.id;
    v_status := 'processed';
  elsif p_outcome = 'cancelled' and v_tx.status in ('initiated', 'pending') then
    update public.hotel_payment_transactions
    set status = 'cancelled', processed_at = now(),
        notes = left(concat_ws(E'\n', nullif(notes, ''), 'Stripe event: ' || p_event_type), 2000)
    where id = v_tx.id;
    v_status := 'processed';
  else
    -- A completed Checkout Session can be unpaid for asynchronous payment methods.
    -- Do not mark it paid until Stripe sends a verified success event.
    v_status := 'processed';
  end if;

  update public.hotel_payment_webhook_events
  set status = v_status, processed_at = now(), attempts = attempts + 1
  where id = v_inserted;

  return jsonb_build_object('ok', true, 'duplicate', false, 'status', v_status);
end
$function$;

revoke all on function public.apply_stripe_checkout_event(text, text, uuid, uuid, text, text, bigint, text, text, text)
  from public, anon, authenticated;
grant execute on function public.apply_stripe_checkout_event(text, text, uuid, uuid, text, text, bigint, text, text, text)
  to service_role;


-- Minimize direct table privileges. RLS remains the row-level boundary for staff access.
revoke all on public.hotel_bookings from anon;
grant select, insert, update on public.hotel_bookings to authenticated;
revoke all on public.hotel_payment_transactions from anon;
revoke delete, truncate, references, trigger on public.hotel_payment_transactions from authenticated;
grant select, insert, update on public.hotel_payment_transactions to authenticated;

-- These are server-owned queues/intake records; access them through the guarded RPCs
-- or server-side service client, never through the public PostgREST table API.
revoke all on public.hotel_payment_webhook_events from anon, authenticated;
revoke all on public.email_outbox from anon, authenticated;
revoke all on public.booking_intake_attempts from anon, authenticated;
revoke all on public.hotel_booking_requests from anon, authenticated;


-- A deposit/prepaid rate plan creates a hold that must be payable online.
-- The legacy create_booking RPC inserts pay_at_property for every booking, so normalize
-- the payment mode at the database boundary rather than trusting the browser.
create or replace function public.set_deposit_booking_online_mode()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  if coalesce(new.deposit_amount, 0) > 0 then
    new.payment_mode := 'online';
  end if;
  return new;
end
$function$;

revoke all on function public.set_deposit_booking_online_mode() from public, anon, authenticated;
drop trigger if exists trg_deposit_booking_online_mode on public.hotel_bookings;
create trigger trg_deposit_booking_online_mode
before insert on public.hotel_bookings
for each row execute function public.set_deposit_booking_online_mode();
