-- Guest lifecycle notifications, transactional SMS and owner integration outbox.
-- Provider credentials remain Vercel secrets, never database fields or client bundles.

alter table public.hotel_house_policies
  add column if not exists public_review_url text not null default '';

create unique index if not exists email_outbox_booking_kind_once_idx
  on public.email_outbox (booking_id, kind)
  where booking_id is not null;

create table if not exists public.sms_outbox (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.hotel_bookings(id) on delete cascade,
  kind text not null,
  to_phone text not null,
  body_text text not null,
  status text not null default 'pending' check (status in ('pending','sending','sent','failed','skipped')),
  attempts integer not null default 0,
  scheduled_for timestamptz not null default now(),
  claimed_at timestamptz,
  sent_at timestamptz,
  provider text,
  provider_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  unique (booking_id, kind, to_phone)
);
create index if not exists sms_outbox_pending_idx on public.sms_outbox (scheduled_for, created_at) where status='pending';
alter table public.sms_outbox enable row level security;
revoke all on public.sms_outbox from public, anon, authenticated;
grant all on public.sms_outbox to service_role;

create table if not exists public.owner_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.hotel_bookings(id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','sending','sent','failed','skipped')),
  attempts integer not null default 0,
  scheduled_for timestamptz not null default now(),
  claimed_at timestamptz,
  sent_at timestamptz,
  provider text,
  provider_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  unique (booking_id, kind)
);
create index if not exists owner_notification_outbox_pending_idx on public.owner_notification_outbox (scheduled_for, created_at) where status='pending';
alter table public.owner_notification_outbox enable row level security;
revoke all on public.owner_notification_outbox from public, anon, authenticated;
grant all on public.owner_notification_outbox to service_role;

create or replace function public.enqueue_guest_booking_status_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_cfg public.hotel_house_policies%rowtype;
  v_room text;
  v_subject text;
  v_body text;
  v_kind text;
  v_sms text;
  v_locale text := 'en';
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;
  if new.status not in ('confirmed','cancelled','no_show') then
    return new;
  end if;

  select * into v_cfg from public.hotel_house_policies limit 1;
  select coalesce(name_en, 'Accommodation') into v_room
  from public.hotel_rooms where id = new.room_id;
  v_kind := case new.status
    when 'confirmed' then 'booking_confirmed'
    when 'cancelled' then 'booking_cancelled'
    else 'booking_no_show'
  end;
  v_subject := case new.status
    when 'confirmed' then 'Your Villa Memaj booking is confirmed · ' || coalesce(new.code,'')
    when 'cancelled' then 'Booking update · ' || coalesce(new.code,'')
    else 'Booking status update · ' || coalesce(new.code,'')
  end;

  if new.status = 'confirmed' then
    v_body :=
      'Your booking is confirmed. / Η κράτησή σας επιβεβαιώθηκε.' || E'\n\n' ||
      'Booking reference: ' || coalesce(new.code,'') || E'\n' ||
      'Accommodation: ' || coalesce(v_room,'') || E'\n' ||
      'Stay: ' || new.check_in || ' to ' || new.check_out || E'\n' ||
      'Guests: ' || coalesce(new.adults,1) || ' adults, ' || coalesce(new.children,0) || ' children' || E'\n' ||
      'Total: ' || new.currency_code || ' ' || to_char(coalesce(new.total_price,0),'FM9999999990.00') || E'\n' ||
      'Deposit: ' || new.currency_code || ' ' || to_char(coalesce(new.deposit_amount,0),'FM9999999990.00') || E'\n' ||
      'Recorded paid: ' || new.currency_code || ' ' || to_char(coalesce(new.amount_paid,0),'FM9999999990.00') || E'\n' ||
      'Balance currently due: ' || new.currency_code || ' ' || to_char(coalesce(new.balance_due,greatest(coalesce(new.total_price,0)-coalesce(new.amount_paid,0),0)),'FM9999999990.00') || E'\n\n' ||
      'Please review the applicable booking terms, payment information and cancellation conditions before travelling:' || E'\n' ||
      'Terms: ' || coalesce(current_setting('app.site_url', true), 'https://villamemaj-2026-website.vercel.app') || '/en/terms' || E'\n' ||
      'Cancellations & refunds: ' || coalesce(current_setting('app.site_url', true), 'https://villamemaj-2026-website.vercel.app') || '/en/cancellation' || E'\n' ||
      'House rules: ' || coalesce(current_setting('app.site_url', true), 'https://villamemaj-2026-website.vercel.app') || '/en/house-rules' || E'\n' ||
      'Greek terms: ' || coalesce(current_setting('app.site_url', true), 'https://villamemaj-2026-website.vercel.app') || '/el/terms' || E'\n' ||
      'Greek cancellation policy: ' || coalesce(current_setting('app.site_url', true), 'https://villamemaj-2026-website.vercel.app') || '/el/cancellation' || E'\n\n' ||
      'Check-in: ' || coalesce(v_cfg.check_in_time,'12:00–23:00') || E'\n' ||
      'Check-out: ' || coalesce(v_cfg.check_out_time,'08:00–10:00') || E'\n' ||
      'Contact: ' || coalesce(v_cfg.contact_email,'info@villamemaj.com') || ' · ' || coalesce(v_cfg.contact_phone,'') || E'\n\n' ||
      'This email confirms the booking status in our system. Keep it for your records.';
    v_sms := 'Villa Memaj: booking ' || coalesce(new.code,'') || ' confirmed for ' || new.check_in || ' to ' || new.check_out || '. Terms/cancellation: https://villamemaj-2026-website.vercel.app/en/terms . Contact info@villamemaj.com.';
  elsif new.status = 'cancelled' then
    v_body :=
      'Your booking status has been updated to cancelled. / Η κράτησή σας ακυρώθηκε.' || E'\n\n' ||
      'Reference: ' || coalesce(new.code,'') || E'\n' ||
      'Stay: ' || new.check_in || ' to ' || new.check_out || E'\n' ||
      'Cancellation reason recorded: ' || coalesce(nullif(new.cancellation_reason,''),'Please contact the property if you need clarification.') || E'\n' ||
      'Cancellation terms: https://villamemaj-2026-website.vercel.app/en/cancellation' || E'\n' ||
      'If a refund is due, it will be handled under the terms of your rate and applicable law. A browser message does not itself confirm a refund.';
    v_sms := 'Villa Memaj: booking ' || coalesce(new.code,'') || ' status changed to cancelled. Review the cancellation terms in your confirmation or contact info@villamemaj.com.';
  else
    v_body :=
      'Booking status update / Ενημέρωση κράτησης' || E'\n\n' ||
      'Reference: ' || coalesce(new.code,'') || E'\n' ||
      'The booking status is recorded as no-show. Please contact the property if you think this is an error.' || E'\n' ||
      'Cancellation / no-show terms: https://villamemaj-2026-website.vercel.app/en/cancellation';
    v_sms := 'Villa Memaj: status update for booking ' || coalesce(new.code,'') || '. Contact info@villamemaj.com if you need help.';
  end if;

  insert into public.email_outbox (booking_id,kind,to_email,to_name,subject,body_text,scheduled_for)
  values (new.id,v_kind,new.guest_email,new.guest_name,v_subject,v_body,now())
  on conflict (booking_id,kind) where booking_id is not null do nothing;

  if nullif(trim(coalesce(new.guest_phone,'')),'') is not null then
    insert into public.sms_outbox (booking_id,kind,to_phone,body_text,scheduled_for)
    values (new.id,v_kind,new.guest_phone,v_sms,now())
    on conflict (booking_id,kind,to_phone) do nothing;
  end if;

  return new;
end
$function$;

revoke all on function public.enqueue_guest_booking_status_message() from public, anon, authenticated;
drop trigger if exists trg_guest_booking_status_message on public.hotel_bookings;
create trigger trg_guest_booking_status_message
after insert or update of status on public.hotel_bookings
for each row execute function public.enqueue_guest_booking_status_message();

create or replace function public.enqueue_owner_booking_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_room text;
  v_kind text;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;
  if tg_op = 'INSERT' then
    v_kind := case when new.status in ('request','hold') then 'booking_request' else 'booking_created' end;
  else
    v_kind := 'booking_status_' || new.status;
  end if;

  select coalesce(name_en,'Accommodation') into v_room from public.hotel_rooms where id = new.room_id;
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.owner_notification_outbox (booking_id,kind,payload,scheduled_for)
    values (
      new.id,
      v_kind,
      jsonb_build_object(
        'title', case when new.status in ('request','hold') then 'New booking activity' else 'Booking status changed' end,
        'reference', coalesce(new.code,''),
        'status', new.status,
        'room', coalesce(v_room,''),
        'check_in', new.check_in,
        'check_out', new.check_out,
        'currency', new.currency_code,
        'total', coalesce(new.total_price,0),
        'crm_url', 'https://villamemaj-2026-website.vercel.app/admin/reservations'
      ),
      now()
    ) on conflict (booking_id,kind) do nothing;
  end if;
  return new;
end
$function$;

revoke all on function public.enqueue_owner_booking_event() from public, anon, authenticated;
drop trigger if exists trg_owner_booking_event on public.hotel_bookings;
create trigger trg_owner_booking_event
after insert or update of status on public.hotel_bookings
for each row execute function public.enqueue_owner_booking_event();

create or replace function public.queue_guest_lifecycle_messages()
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_email_count integer := 0;
  v_sms_count integer := 0;
  v_cfg public.hotel_house_policies%rowtype;
  b record;
  v_kind text;
  v_subject text;
  v_body text;
  v_sms text;
begin
  if coalesce(auth.role(),'') <> 'service_role' then
    raise exception 'service_role required' using errcode='42501';
  end if;
  select * into v_cfg from public.hotel_house_policies limit 1;

  for b in
    select h.*, coalesce(r.name_en,'Accommodation') as room_name_en, coalesce(r.name_el,'Κατάλυμα') as room_name_el
    from public.hotel_bookings h
    left join public.hotel_rooms r on r.id=h.room_id
    where h.status='confirmed'
      and h.check_in between current_date and current_date + 14
      and h.check_out > h.check_in
  loop
    v_kind := null;
    if b.check_in = current_date + 14 then
      v_kind := 'reminder_14d';
      v_subject := 'Your Villa Memaj stay is in two weeks · ' || coalesce(b.code,'');
      v_body := 'We look forward to welcoming you in two weeks. / Ανυπομονούμε να σας καλωσορίσουμε σε δύο εβδομάδες.' || E'\n\n' ||
        'Reference: ' || coalesce(b.code,'') || E'\n' ||
        'Room: ' || b.room_name_en || ' / ' || b.room_name_el || E'\n' ||
        'Dates: ' || b.check_in || ' to ' || b.check_out || E'\n' ||
        'Please re-check the terms, cancellation deadline and balance shown in your confirmation:' || E'\n' ||
        'Terms: https://villamemaj-2026-website.vercel.app/en/terms' || E'\n' ||
        'Cancellation & refunds: https://villamemaj-2026-website.vercel.app/en/cancellation' || E'\n' ||
        'House rules: https://villamemaj-2026-website.vercel.app/en/house-rules' || E'\n' ||
        'Need help? info@villamemaj.com';
    elsif b.check_in = current_date + 7 then
      v_kind := 'reminder_7d';
      v_subject := 'Your Villa Memaj stay is one week away · ' || coalesce(b.code,'');
      v_body := 'Your stay is one week away. Please review your arrival time, outstanding balance and reservation-specific cancellation terms. / Η διαμονή σας είναι σε μία εβδομάδα. Ελέγξτε την ώρα άφιξης, το υπόλοιπο και τους ειδικούς όρους ακύρωσης.' || E'\n\n' ||
        'Reference: ' || coalesce(b.code,'') || E'\n' ||
        'Dates: ' || b.check_in || ' to ' || b.check_out || E'\n' ||
        'Check-in: ' || coalesce(v_cfg.check_in_time,'12:00–23:00') || E'\n' ||
        'Cancellation: https://villamemaj-2026-website.vercel.app/en/cancellation' || E'\n' ||
        'Terms: https://villamemaj-2026-website.vercel.app/en/terms' || E'\n' ||
        'Contact: info@villamemaj.com';
    elsif b.check_in = current_date + 1 then
      v_kind := 'welcome_1d';
      v_subject := 'Welcome to Villa Memaj tomorrow · ' || coalesce(b.code,'');
      v_body := 'We look forward to welcoming you tomorrow. / Ανυπομονούμε να σας καλωσορίσουμε αύριο.' || E'\n\n' ||
        'Reference: ' || coalesce(b.code,'') || E'\n' ||
        'Accommodation: ' || b.room_name_en || ' / ' || b.room_name_el || E'\n' ||
        'Check-in window: ' || coalesce(v_cfg.check_in_time,'12:00–23:00') || E'\n' ||
        'Check-out: ' || coalesce(v_cfg.check_out_time,'08:00–10:00') || E'\n' ||
        'Guest information: ' || 'https://villamemaj-2026-website.vercel.app/en/house-rules' || E'\n' ||
        'Terms: https://villamemaj-2026-website.vercel.app/en/terms' || E'\n' ||
        'Cancellations & refunds: https://villamemaj-2026-website.vercel.app/en/cancellation' || E'\n\n' ||
        'Explore Vlorë and the Albanian Riviera: the Lungomare waterfront, local beaches, the Zvernec Lagoon and Monastery, and day trips toward Llogara National Park. Check current opening times, weather and transport locally. Distances and transport options depend on the exact itinerary.' || E'\n\n' ||
        'For arrival coordination: info@villamemaj.com';
    end if;

    if v_kind is not null then
      insert into public.email_outbox (booking_id,kind,to_email,to_name,subject,body_text,scheduled_for)
      values (b.id,v_kind,b.guest_email,b.guest_name,v_subject,v_body,now())
      on conflict (booking_id,kind) where booking_id is not null do nothing;
      get diagnostics v_email_count = row_count;

      if nullif(trim(coalesce(b.guest_phone,'')),'') is not null then
        v_sms := case v_kind
          when 'reminder_14d' then 'Villa Memaj reminder: stay ' || b.check_in || ' to ' || b.check_out || ', ref ' || coalesce(b.code,'') || '. Review terms: villamemaj-2026-website.vercel.app/en/terms'
          when 'reminder_7d' then 'Villa Memaj: one week to your stay (' || b.check_in || '). Ref ' || coalesce(b.code,'') || '. Contact info@villamemaj.com if needed.'
          else 'Villa Memaj welcomes you tomorrow. Check-in ' || coalesce(v_cfg.check_in_time,'12:00–23:00') || '. Ref ' || coalesce(b.code,'') || '. Info: villamemaj-2026-website.vercel.app/en/house-rules'
        end;
        insert into public.sms_outbox (booking_id,kind,to_phone,body_text,scheduled_for)
        values (b.id,v_kind,b.guest_phone,v_sms,now())
        on conflict (booking_id,kind,to_phone) do nothing;
        get diagnostics v_sms_count = row_count;
      end if;
    end if;
  end loop;

  -- Request a post-stay message only after staff marks the booking checked out.
  for b in
    select h.* from public.hotel_bookings h
    where h.status='checked_out'
      and coalesce(h.checked_out_at, (h.check_out::timestamp at time zone 'Europe/Tirane')) <= now() - interval '2 hours'
      and h.check_out >= current_date - 30
  loop
    v_subject := 'Thank you for staying at Villa Memaj · ' || coalesce(b.code,'');
    v_body := 'Thank you for staying with Villa Memaj. We hope you had a comfortable visit. / Ευχαριστούμε που μείνατε στη Villa Memaj.' || E'\n\n' ||
      'Reference: ' || coalesce(b.code,'') || E'\n' ||
      'If you would like to share private feedback, reply to this email or contact info@villamemaj.com.' || E'\n' ||
      'Booking terms and privacy: https://villamemaj-2026-website.vercel.app/en/privacy';
    if coalesce(v_cfg.public_review_url,'') <> '' then
      v_body := v_body || E'\n' || 'If you wish to leave a public review, use the property review link: ' || v_cfg.public_review_url;
    end if;
    insert into public.email_outbox (booking_id,kind,to_email,to_name,subject,body_text,scheduled_for)
    values (b.id,'thank_you_checkout',b.guest_email,b.guest_name,v_subject,v_body,now())
    on conflict (booking_id,kind) where booking_id is not null do nothing;
    get diagnostics v_email_count = row_count;
  end loop;

  return jsonb_build_object('ok',true,'queued_email_rows',v_email_count,'queued_sms_rows',v_sms_count);
end
$function$;

revoke all on function public.queue_guest_lifecycle_messages() from public, anon, authenticated;
grant execute on function public.queue_guest_lifecycle_messages() to service_role;

create or replace function public.claim_outbox_sms(p_limit integer default 20)
returns setof public.sms_outbox
language plpgsql
security definer
set search_path = public
as $function$
begin
  if coalesce(auth.role(),'') <> 'service_role' then
    raise exception 'service_role required' using errcode='42501';
  end if;
  update public.sms_outbox set status='pending' where status='sending' and claimed_at < now()-interval '10 minutes';
  return query
  with batch as (
    select id from public.sms_outbox where status='pending' and scheduled_for<=now()
    order by scheduled_for limit greatest(1,least(coalesce(p_limit,20),100)) for update skip locked
  )
  update public.sms_outbox s set status='sending',attempts=s.attempts+1,claimed_at=now()
  from batch b where s.id=b.id returning s.*;
end
$function$;
revoke all on function public.claim_outbox_sms(integer) from public, anon, authenticated;
grant execute on function public.claim_outbox_sms(integer) to service_role;

create or replace function public.finish_outbox_sms(p_id uuid,p_ok boolean,p_provider text default null,p_message_id text default null,p_error text default null)
returns void
language plpgsql
security definer
set search_path = public
as $function$
begin
  if coalesce(auth.role(),'') <> 'service_role' then
    raise exception 'service_role required' using errcode='42501';
  end if;
  if p_ok then
    update public.sms_outbox set status='sent',sent_at=now(),provider=coalesce(p_provider,provider),provider_message_id=p_message_id,last_error=null where id=p_id;
  else
    update public.sms_outbox set status=case when attempts>=5 then 'failed' else 'pending' end,
      provider=coalesce(p_provider,provider),last_error=left(coalesce(p_error,'unknown error'),500),
      scheduled_for=now()+make_interval(mins=>least(1440,attempts*attempts*5))
    where id=p_id;
  end if;
end
$function$;
revoke all on function public.finish_outbox_sms(uuid,boolean,text,text,text) from public, anon, authenticated;
grant execute on function public.finish_outbox_sms(uuid,boolean,text,text,text) to service_role;

create or replace function public.claim_owner_notifications(p_limit integer default 20)
returns setof public.owner_notification_outbox
language plpgsql
security definer
set search_path = public
as $function$
begin
  if coalesce(auth.role(),'') <> 'service_role' then
    raise exception 'service_role required' using errcode='42501';
  end if;
  update public.owner_notification_outbox set status='pending' where status='sending' and claimed_at < now()-interval '10 minutes';
  return query
  with batch as (
    select id from public.owner_notification_outbox where status='pending' and scheduled_for<=now()
    order by scheduled_for limit greatest(1,least(coalesce(p_limit,20),100)) for update skip locked
  )
  update public.owner_notification_outbox n set status='sending',attempts=n.attempts+1,claimed_at=now()
  from batch b where n.id=b.id returning n.*;
end
$function$;
revoke all on function public.claim_owner_notifications(integer) from public, anon, authenticated;
grant execute on function public.claim_owner_notifications(integer) to service_role;

create or replace function public.finish_owner_notification(p_id uuid,p_ok boolean,p_provider text default null,p_message_id text default null,p_error text default null)
returns void
language plpgsql
security definer
set search_path = public
as $function$
begin
  if coalesce(auth.role(),'') <> 'service_role' then
    raise exception 'service_role required' using errcode='42501';
  end if;
  if p_ok then
    update public.owner_notification_outbox set status='sent',sent_at=now(),provider=coalesce(p_provider,provider),provider_message_id=p_message_id,last_error=null where id=p_id;
  else
    update public.owner_notification_outbox set status=case when attempts>=5 then 'failed' else 'pending' end,
      provider=coalesce(p_provider,provider),last_error=left(coalesce(p_error,'unknown error'),500),
      scheduled_for=now()+make_interval(mins=>least(1440,attempts*attempts*5))
    where id=p_id;
  end if;
end
$function$;
revoke all on function public.finish_owner_notification(uuid,boolean,text,text,text) from public, anon, authenticated;
grant execute on function public.finish_owner_notification(uuid,boolean,text,text,text) to service_role;
