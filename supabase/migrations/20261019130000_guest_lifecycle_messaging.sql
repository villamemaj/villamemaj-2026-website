-- Guest lifecycle communications: confirmed-booking, pre-arrival and post-stay email/SMS/WhatsApp.
-- Messages are queued transactionally. Delivery workers are server-only and provider keys stay in Vercel.

alter table public.hotel_house_policies
  add column if not exists arrival_instructions_en text not null default '',
  add column if not exists arrival_instructions_el text not null default '',
  add column if not exists local_guide_en text not null default '',
  add column if not exists local_guide_el text not null default '';

alter table public.hotel_bookings
  add column if not exists sms_opt_in boolean not null default false,
  add column if not exists whatsapp_opt_in boolean not null default false,
  add column if not exists messaging_consent_at timestamptz,
  add column if not exists messaging_consent_source text,
  add column if not exists guest_language text not null default 'en',
  add column if not exists review_token uuid not null default gen_random_uuid();

create unique index if not exists hotel_bookings_review_token_key
  on public.hotel_bookings(review_token);

alter table public.email_outbox
  add column if not exists dedupe_key text;

create unique index if not exists email_outbox_dedupe_key_idx
  on public.email_outbox(dedupe_key)
  where dedupe_key is not null;

create index if not exists email_outbox_due_idx
  on public.email_outbox(status, scheduled_for)
  where status = 'pending';

-- A distinct outbox is used for phone channels, because SMS and WhatsApp require explicit,
-- recorded consent and have different sender/template/provider rules.
create table if not exists public.hotel_guest_message_outbox (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.hotel_bookings(id) on delete cascade,
  kind text not null,
  channel text not null check (channel in ('sms', 'whatsapp')),
  to_phone text not null,
  body_text text not null,
  dedupe_key text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'sending', 'sent', 'failed', 'skipped')),
  attempts integer not null default 0,
  last_error text,
  provider text,
  provider_message_id text,
  scheduled_for timestamptz not null default now(),
  claimed_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists hotel_guest_message_outbox_due_idx
  on public.hotel_guest_message_outbox(status, scheduled_for)
  where status = 'pending';
create index if not exists hotel_guest_message_outbox_booking_idx
  on public.hotel_guest_message_outbox(booking_id);

alter table public.hotel_guest_message_outbox enable row level security;
revoke all on public.hotel_guest_message_outbox from anon, authenticated;

create or replace function public.claim_guest_messages(p_limit integer default 20)
returns setof public.hotel_guest_message_outbox
language plpgsql
security definer
set search_path = public
as $function$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role required' using errcode = '42501';
  end if;

  update public.hotel_guest_message_outbox
  set status = 'pending'
  where status = 'sending' and claimed_at < now() - interval '10 minutes';

  return query
  with batch as (
    select id
    from public.hotel_guest_message_outbox
    where status = 'pending' and scheduled_for <= now()
    order by scheduled_for
    limit greatest(1, least(coalesce(p_limit, 20), 100))
    for update skip locked
  )
  update public.hotel_guest_message_outbox m
  set status = 'sending', attempts = m.attempts + 1, claimed_at = now()
  from batch b
  where m.id = b.id
  returning m.*;
end
$function$;

create or replace function public.claim_guest_messages_for_booking(p_booking_id uuid, p_limit integer default 10)
returns setof public.hotel_guest_message_outbox
language plpgsql
security definer
set search_path = public
as $function$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role required' using errcode = '42501';
  end if;

  return query
  with batch as (
    select id
    from public.hotel_guest_message_outbox
    where booking_id = p_booking_id
      and status = 'pending'
      and scheduled_for <= now()
      and created_at > now() - interval '15 minutes'
    order by scheduled_for
    limit greatest(1, least(coalesce(p_limit, 10), 20))
    for update skip locked
  )
  update public.hotel_guest_message_outbox m
  set status = 'sending', attempts = m.attempts + 1, claimed_at = now()
  from batch b
  where m.id = b.id
  returning m.*;
end
$function$;

create or replace function public.finish_guest_message(
  p_id uuid,
  p_ok boolean,
  p_provider text default null,
  p_message_id text default null,
  p_error text default null
) returns void
language plpgsql
security definer
set search_path = public
as $function$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role required' using errcode = '42501';
  end if;

  if p_ok then
    update public.hotel_guest_message_outbox
    set status = 'sent', sent_at = now(), provider = coalesce(p_provider, provider),
        provider_message_id = p_message_id, last_error = null
    where id = p_id;
  else
    update public.hotel_guest_message_outbox
    set status = case when attempts >= 5 then 'failed' else 'pending' end,
        last_error = left(coalesce(p_error, 'unknown error'), 500),
        provider = coalesce(p_provider, provider),
        scheduled_for = now() + make_interval(mins => least(360, attempts * attempts * 5))
    where id = p_id;
  end if;
end
$function$;

revoke all on function public.claim_guest_messages(integer) from public, anon, authenticated;
revoke all on function public.claim_guest_messages_for_booking(uuid, integer) from public, anon, authenticated;
revoke all on function public.finish_guest_message(uuid, boolean, text, text, text) from public, anon, authenticated;
grant execute on function public.claim_guest_messages(integer) to service_role;
grant execute on function public.claim_guest_messages_for_booking(uuid, integer) to service_role;
grant execute on function public.finish_guest_message(uuid, boolean, text, text, text) to service_role;

-- Queue guest-facing messages when a booking becomes confirmed, and schedule reminders.
-- Cancellation policy values are copied from the reservation snapshot so later policy edits
-- cannot change the terms that applied to an already accepted booking.
create or replace function public.enqueue_booking_lifecycle_emails()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_cfg public.hotel_house_policies%rowtype;
  v_room_en text;
  v_room_el text;
  v_lang text;
  v_base text := 'https://villamemaj-2026-website.vercel.app';
  v_cancel_name text;
  v_free_hours text;
  v_late_penalty text;
  v_no_show_penalty text;
  v_non_refundable text;
  v_rules text;
  v_arrival text;
  v_guide text;
  v_confirmation text;
  v_owner_body text;
  v_reminder14 text;
  v_reminder7 text;
  v_welcome text;
  v_thanks text;
  v_recipients text[];
  v_recipient text;
  v_due timestamptz;
  v_nights integer;
  v_total text;
  v_deposit text;
  v_balance text;
  v_status_changed boolean := TG_OP = 'INSERT';
  v_checked_out_changed boolean := TG_OP = 'INSERT';
begin
  if TG_OP = 'UPDATE' then
    v_status_changed := old.status is distinct from new.status;
    v_checked_out_changed := old.checked_out_at is distinct from new.checked_out_at;
  end if;
  if not v_status_changed and not v_checked_out_changed then
    return new;
  end if;

  select * into v_cfg from public.hotel_house_policies limit 1;
  v_lang := case when new.guest_language = 'el' then 'el' else 'en' end;
  select name_en, name_el into v_room_en, v_room_el
  from public.hotel_rooms where id = new.room_id;

  if new.status = 'cancelled' and v_status_changed then
    update public.email_outbox
    set status = 'skipped'
    where booking_id = new.id and status = 'pending'
      and kind in ('booking_reminder_14d', 'booking_reminder_7d', 'booking_welcome_24h', 'booking_thank_you_review');
    update public.hotel_guest_message_outbox
    set status = 'skipped'
    where booking_id = new.id and status = 'pending'
      and kind in ('booking_reminder_14d', 'booking_reminder_7d', 'booking_welcome_24h', 'booking_thank_you_review');

    insert into public.email_outbox
      (booking_id, kind, to_email, to_name, subject, body_text, dedupe_key)
    values
      (new.id, 'booking_cancelled_guest', new.guest_email, new.guest_name,
       case when v_lang = 'el' then 'Ακύρωση κράτησης ' || coalesce(new.code, '') else 'Booking cancellation ' || coalesce(new.code, '') end,
       case when v_lang = 'el'
         then 'Η κράτηση ' || coalesce(new.code, '') || ' σημειώθηκε ως ακυρωμένη.' || E'\n'
           || 'Αν δεν ζητήσατε την ακύρωση ή χρειάζεστε διευκρινίσεις, επικοινωνήστε μαζί μας.'
         else 'Booking ' || coalesce(new.code, '') || ' has been marked as cancelled.' || E'\n'
           || 'If you did not request this or need clarification, please contact the property.'
       end,
       'booking:' || new.id::text || ':cancelled:guest:' || to_char(coalesce(new.cancelled_at, now()), 'YYYYMMDDHH24MISS'))
    on conflict (dedupe_key) where dedupe_key is not null do nothing;
    return new;
  end if;

  if new.status = 'confirmed' and v_status_changed then
    v_nights := coalesce(new.nights, new.check_out - new.check_in);
    v_total := to_char(coalesce(new.total_price, 0), 'FM9999999990.00');
    v_deposit := to_char(coalesce(new.deposit_amount, 0), 'FM9999999990.00');
    v_balance := to_char(greatest(coalesce(new.total_price, 0) - coalesce(new.deposit_amount, 0), 0), 'FM9999999990.00');

    v_cancel_name := coalesce(new.cancellation_policy_snapshot #>> '{cancellation_policy,name}', 'As stated in your accepted booking offer');
    v_free_hours := coalesce(new.cancellation_policy_snapshot #>> '{cancellation_policy,free_cancel_before_hours}', 'Not specified');
    v_late_penalty := coalesce(new.cancellation_policy_snapshot #>> '{cancellation_policy,late_cancel_penalty_type}', 'Not specified')
      || case when new.cancellation_policy_snapshot #>> '{cancellation_policy,late_cancel_penalty_percent}' is not null
        then ' (' || (new.cancellation_policy_snapshot #>> '{cancellation_policy,late_cancel_penalty_percent}') || '%)' else '' end;
    v_no_show_penalty := coalesce(new.cancellation_policy_snapshot #>> '{cancellation_policy,no_show_penalty_type}', 'Not specified')
      || case when new.cancellation_policy_snapshot #>> '{cancellation_policy,no_show_penalty_percent}' is not null
        then ' (' || (new.cancellation_policy_snapshot #>> '{cancellation_policy,no_show_penalty_percent}') || '%)' else '' end;
    v_non_refundable := case when coalesce((new.cancellation_policy_snapshot #>> '{cancellation_policy,non_refundable}')::boolean, false)
      then 'Yes / Ναι' else 'No / Όχι' end;

    v_rules := case when v_lang = 'el' then
      'Άφιξη: ' || coalesce(v_cfg.check_in_time, 'σύμφωνα με την επιβεβαίωση') || E'\n'
      || 'Αναχώρηση: ' || coalesce(v_cfg.check_out_time, 'σύμφωνα με την επιβεβαίωση') || E'\n'
      || 'Παιδιά: ' || coalesce(v_cfg.children_policy, case when v_cfg.children_allowed then 'Επιτρέπονται' else 'Δεν επιτρέπονται' end) || E'\n'
      || 'Κάπνισμα: ' || case when v_cfg.smoking_allowed then 'Επιτρέπεται' else 'Δεν επιτρέπεται' end || E'\n'
      || 'Κατοικίδια: ' || case when v_cfg.pets_allowed then 'Επιτρέπονται σύμφωνα με τους όρους κράτησης' else 'Δεν επιτρέπονται' end || E'\n'
      || 'Πάρτι: ' || case when v_cfg.parties_allowed then 'Μόνο σύμφωνα με την επιβεβαίωση' else 'Δεν επιτρέπονται' end || E'\n'
      || 'Ώρες κοινής ησυχίας: ' || coalesce(nullif(v_cfg.quiet_hours, ''), 'Δεν έχουν οριστεί ειδικές ώρες') || E'\n'
      || 'Internet: ' || coalesce(nullif(v_cfg.internet_information, ''), 'Επικοινωνήστε μαζί μας') || E'\n'
      || 'Στάθμευση: ' || coalesce(nullif(v_cfg.parking_information, ''), 'Επικοινωνήστε μαζί μας')
    else
      'Check-in: ' || coalesce(v_cfg.check_in_time, 'as stated in the confirmation') || E'\n'
      || 'Check-out: ' || coalesce(v_cfg.check_out_time, 'as stated in the confirmation') || E'\n'
      || 'Children: ' || coalesce(v_cfg.children_policy, case when v_cfg.children_allowed then 'Allowed' else 'Not allowed' end) || E'\n'
      || 'Smoking: ' || case when v_cfg.smoking_allowed then 'Allowed under property rules' else 'Not allowed' end || E'\n'
      || 'Pets: ' || case when v_cfg.pets_allowed then 'Allowed only under the booking terms' else 'Not allowed' end || E'\n'
      || 'Parties: ' || case when v_cfg.parties_allowed then 'Only as expressly confirmed' else 'Not allowed' end || E'\n'
      || 'Quiet hours: ' || coalesce(nullif(v_cfg.quiet_hours, ''), 'No specific quiet hours published') || E'\n'
      || 'Internet: ' || coalesce(nullif(v_cfg.internet_information, ''), 'Contact the property') || E'\n'
      || 'Parking: ' || coalesce(nullif(v_cfg.parking_information, ''), 'Contact the property')
    end;

    v_arrival := case when v_lang = 'el'
      then coalesce(nullif(v_cfg.arrival_instructions_el, ''), 'Επικοινωνήστε μαζί μας πριν από την άφιξη για πρακτικές οδηγίες.')
      else coalesce(nullif(v_cfg.arrival_instructions_en, ''), 'Please contact us before arrival for practical arrival instructions.')
    end;
    v_guide := case when v_lang = 'el'
      then coalesce(nullif(v_cfg.local_guide_el, ''), 'Επικοινωνήστε μαζί μας για επιβεβαιωμένες τοπικές προτάσεις, μετακινήσεις και δραστηριότητες.')
      else coalesce(nullif(v_cfg.local_guide_en, ''), 'Contact us for verified local recommendations, transport information and activities.')
    end;

    v_confirmation := case when v_lang = 'el' then
      'Η κράτησή σας επιβεβαιώθηκε στη Villa Memaj.' || E'\n\n'
      || 'Κωδικός: ' || coalesce(new.code, new.id::text) || E'\n'
      || 'Δωμάτιο: ' || coalesce(v_room_el, v_room_en, '') || E'\n'
      || 'Διαμονή: ' || new.check_in || ' έως ' || new.check_out || ' (' || v_nights || ' διανυκτερεύσεις)' || E'\n'
      || 'Επισκέπτες: ' || new.adults || ' ενήλικες, ' || coalesce(new.children, 0) || ' παιδιά' || E'\n'
      || 'Σύνολο: ' || new.currency_code || ' ' || v_total || E'\n'
      || 'Προκαταβολή: ' || new.currency_code || ' ' || v_deposit || E'\n'
      || 'Υπόλοιπο πριν από τυχόν επόμενες πληρωμές: ' || new.currency_code || ' ' || v_balance || E'\n\n'
      || 'ΟΡΟΙ ΚΑΤΑΛΥΜΑΤΟΣ' || E'\n' || v_rules || E'\n\n'
      || 'ΟΡΟΙ ΑΚΥΡΩΣΗΣ ΤΗΣ ΚΡΑΤΗΣΗΣ' || E'\n'
      || 'Πολιτική: ' || v_cancel_name || E'\n'
      || 'Δωρεάν ακύρωση πριν από την άφιξη (ώρες): ' || v_free_hours || E'\n'
      || 'Χρέωση καθυστερημένης ακύρωσης: ' || v_late_penalty || E'\n'
      || 'Χρέωση μη εμφάνισης: ' || v_no_show_penalty || E'\n'
      || 'Μη επιστρέψιμη τιμή: ' || v_non_refundable || E'\n\n'
      || 'Πρόσθετοι όροι καταλύματος:' || E'\n' || coalesce(nullif(v_cfg.terms_el, ''), 'Ισχύουν οι όροι της αποδεκτής προσφοράς και η σελίδα όρων κράτησης.') || E'\n\n'
      || 'Δείτε επίσης:' || E'\n'
      || v_base || '/el/terms' || E'\n'
      || v_base || '/el/cancellation' || E'\n'
      || v_base || '/el/house-rules' || E'\n\n'
      || 'Άφιξη: ' || v_arrival || E'\n\n'
      || 'Τοπικές προτάσεις και δραστηριότητες:' || E'\n' || v_guide || E'\n\n'
      || 'Αν κάτι δεν συμφωνεί με την προσφορά σας, επικοινωνήστε μαζί μας πριν πληρώσετε. Μην στέλνετε στοιχεία κάρτας μέσω email.'
    else
      'Your reservation at Villa Memaj is confirmed.' || E'\n\n'
      || 'Reference: ' || coalesce(new.code, new.id::text) || E'\n'
      || 'Room: ' || coalesce(v_room_en, v_room_el, '') || E'\n'
      || 'Stay: ' || new.check_in || ' to ' || new.check_out || ' (' || v_nights || ' nights)' || E'\n'
      || 'Guests: ' || new.adults || ' adults, ' || coalesce(new.children, 0) || ' children' || E'\n'
      || 'Total: ' || new.currency_code || ' ' || v_total || E'\n'
      || 'Deposit: ' || new.currency_code || ' ' || v_deposit || E'\n'
      || 'Remaining at this stage: ' || new.currency_code || ' ' || v_balance || E'\n\n'
      || 'PROPERTY POLICIES' || E'\n' || v_rules || E'\n\n'
      || 'CANCELLATION TERMS FOR YOUR RATE' || E'\n'
      || 'Policy: ' || v_cancel_name || E'\n'
      || 'Free cancellation deadline (hours before arrival): ' || v_free_hours || E'\n'
      || 'Late-cancellation penalty: ' || v_late_penalty || E'\n'
      || 'No-show penalty: ' || v_no_show_penalty || E'\n'
      || 'Non-refundable rate: ' || v_non_refundable || E'\n\n'
      || 'Additional property-specific terms:' || E'\n' || coalesce(nullif(v_cfg.terms_en, ''), 'Your accepted rate offer and booking terms remain applicable.') || E'\n\n'
      || 'Please review:' || E'\n'
      || v_base || '/' || v_lang || '/terms' || E'\n'
      || v_base || '/' || v_lang || '/cancellation' || E'\n'
      || v_base || '/' || v_lang || '/house-rules' || E'\n\n'
      || 'Arrival instructions:' || E'\n' || v_arrival || E'\n\n'
      || 'Local guide and activities:' || E'\n' || v_guide || E'\n\n'
      || 'If anything differs from your offer, contact us before making a payment. Never send card details by email.'
    end;

    insert into public.email_outbox
      (booking_id, kind, to_email, to_name, subject, body_text, scheduled_for, dedupe_key)
    values
      (new.id, 'booking_confirmed_guest', new.guest_email, new.guest_name,
       case when v_lang = 'el' then 'Επιβεβαίωση κράτησης ' || coalesce(new.code, '')
            else 'Booking confirmation ' || coalesce(new.code, '') end,
       v_confirmation, now(), 'booking:' || new.id::text || ':confirmed:guest')
    on conflict (dedupe_key) where dedupe_key is not null do nothing;

    v_owner_body := 'Booking confirmed: ' || coalesce(new.code, new.id::text) || E'\n'
      || coalesce(new.guest_name, '') || ' <' || coalesce(new.guest_email, '') || '>' || E'\n'
      || 'Phone: ' || coalesce(new.guest_phone, 'not provided') || E'\n'
      || 'Room: ' || coalesce(v_room_en, '') || E'\n'
      || 'Dates: ' || new.check_in || ' to ' || new.check_out || E'\n'
      || 'Total: ' || new.currency_code || ' ' || v_total
      || ' | Deposit: ' || v_deposit
      || ' | Balance before further payments: ' || v_balance || E'\n'
      || 'Open the CRM reservations workspace to review the booking.';
    v_recipients := coalesce(nullif(v_cfg.notification_emails, '{}'), array[coalesce(v_cfg.contact_email, '')]);
    foreach v_recipient in array v_recipients loop
      if coalesce(trim(v_recipient), '') <> '' then
        insert into public.email_outbox
          (booking_id, kind, to_email, to_name, subject, body_text, dedupe_key)
        values
          (new.id, 'booking_confirmed_owner', v_recipient, null,
           'Booking confirmed ' || coalesce(new.code, new.id::text) || ' — ' || coalesce(v_room_en, ''),
           v_owner_body, 'booking:' || new.id::text || ':confirmed:owner:' || lower(trim(v_recipient)))
        on conflict (dedupe_key) where dedupe_key is not null do nothing;
      end if;
    end loop;

    -- Queue only messages whose send time is still in the future; never send weeks-old reminders
    -- immediately when an owner confirms a last-minute reservation.
    v_due := (((new.check_in - 14) + time '09:00') at time zone 'Europe/Tirane');
    if v_due > now() then
      v_reminder14 := case when v_lang = 'el'
        then 'Υπενθύμιση Villa Memaj: η άφιξή σας είναι στις ' || new.check_in || '. Κωδικός ' || coalesce(new.code, '') || E'\n'
          || 'Ελέγξτε την προσφορά, την πολιτική ακύρωσης και τους κανόνες καταλύματος. Για αλλαγές, επικοινωνήστε μαζί μας.'
        else 'Villa Memaj reminder: your check-in date is ' || new.check_in || '. Reference ' || coalesce(new.code, '') || E'\n'
          || 'Please review your offer, cancellation terms and house rules. Contact us before making changes.'
        end;
      insert into public.email_outbox (booking_id, kind, to_email, to_name, subject, body_text, scheduled_for, dedupe_key)
      values (new.id, 'booking_reminder_14d', new.guest_email, new.guest_name,
        case when v_lang='el' then 'Υπενθύμιση κράτησης — 14 ημέρες' else 'Your stay is coming up — 14-day reminder' end,
        v_reminder14, v_due, 'booking:' || new.id::text || ':reminder:14d')
      on conflict (dedupe_key) where dedupe_key is not null do nothing;
    end if;

    v_due := (((new.check_in - 7) + time '09:00') at time zone 'Europe/Tirane');
    if v_due > now() then
      v_reminder7 := case when v_lang = 'el'
        then 'Η διαμονή σας στη Villa Memaj πλησιάζει. Άφιξη: ' || new.check_in || '. Αναχώρηση: ' || new.check_out || '. Κωδικός ' || coalesce(new.code, '') || E'\n'
          || 'Αν χρειάζεστε αλλαγή ή έχετε ερώτηση, επικοινωνήστε μαζί μας.'
        else 'Your stay at Villa Memaj is approaching. Check-in: ' || new.check_in || '. Check-out: ' || new.check_out || '. Reference ' || coalesce(new.code, '') || E'\n'
          || 'Contact us if you need to discuss a change or have a question.'
        end;
      insert into public.email_outbox (booking_id, kind, to_email, to_name, subject, body_text, scheduled_for, dedupe_key)
      values (new.id, 'booking_reminder_7d', new.guest_email, new.guest_name,
        case when v_lang='el' then 'Υπενθύμιση κράτησης — 7 ημέρες' else 'Your stay is one week away' end,
        v_reminder7, v_due, 'booking:' || new.id::text || ':reminder:7d')
      on conflict (dedupe_key) where dedupe_key is not null do nothing;
    end if;

    v_due := (((new.check_in - 1) + time '09:00') at time zone 'Europe/Tirane');
    if v_due > now() then
      v_welcome := case when v_lang = 'el' then
        'Καλώς ήρθατε σύντομα στη Villa Memaj!' || E'\n\n'
        || 'Άφιξη: ' || new.check_in || ' · Αναχώρηση: ' || new.check_out || E'\n'
        || 'Ώρα check-in: ' || coalesce(v_cfg.check_in_time, 'σύμφωνα με την επιβεβαίωση') || E'\n'
        || 'Οδηγίες άφιξης: ' || coalesce(nullif(v_cfg.arrival_instructions_el, ''), 'Επικοινωνήστε μαζί μας για οδηγίες άφιξης.') || E'\n\n'
        || 'Τοπικός οδηγός και δραστηριότητες:' || E'\n'
        || coalesce(nullif(v_cfg.local_guide_el, ''), 'Επικοινωνήστε μαζί μας για επιβεβαιωμένες προτάσεις για την περιοχή.') || E'\n\n'
        || 'Υπενθύμιση κανόνων: κατοικίδια και πάρτι δεν επιτρέπονται. Ακολουθήστε την επιβεβαίωση και τους κανόνες καταλύματος.'
      else
        'Welcome to Villa Memaj — your arrival is tomorrow.' || E'\n\n'
        || 'Check-in: ' || new.check_in || ' · Check-out: ' || new.check_out || E'\n'
        || 'Check-in time: ' || coalesce(v_cfg.check_in_time, 'as stated in your confirmation') || E'\n'
        || 'Arrival instructions: ' || coalesce(nullif(v_cfg.arrival_instructions_en, ''), 'Please contact us for your arrival instructions.') || E'\n\n'
        || 'Local guide and activities:' || E'\n'
        || coalesce(nullif(v_cfg.local_guide_en, ''), 'Contact us for verified recommendations for the area.') || E'\n\n'
        || 'House-rules reminder: pets and parties are not allowed. Please follow your confirmation and the published house rules.'
      end;
      insert into public.email_outbox (booking_id, kind, to_email, to_name, subject, body_text, scheduled_for, dedupe_key)
      values (new.id, 'booking_welcome_24h', new.guest_email, new.guest_name,
        case when v_lang='el' then 'Καλώς ήρθατε σύντομα στη Villa Memaj' else 'Welcome to Villa Memaj — arrival information' end,
        v_welcome, v_due, 'booking:' || new.id::text || ':welcome:24h')
      on conflict (dedupe_key) where dedupe_key is not null do nothing;
    end if;
  end if;

  -- A thank-you/review invitation is sent only after staff marks checkout, never just because
  -- a check-out date is in the past. The review token is opaque and unique to this booking.
  if (new.status = 'checked_out' and v_status_changed)
     or (new.checked_out_at is not null and v_checked_out_changed) then
    v_due := coalesce(new.checked_out_at, (new.check_out + time '11:00') at time zone 'Europe/Tirane') + interval '1 day';
    v_thanks := case when v_lang = 'el' then
      'Σας ευχαριστούμε που μείνατε στη Villa Memaj.' || E'\n\n'
      || 'Ελπίζουμε να απολαύσατε τη διαμονή σας. Θα μας βοηθούσε πολύ μια ειλικρινής αξιολόγηση της εμπειρίας σας:' || E'\n'
      || v_base || '/' || v_lang || '/review?token=' || new.review_token::text || E'\n\n'
      || 'Αν κάτι δεν ήταν όπως αναμενόταν, επικοινωνήστε μαζί μας ώστε να το εξετάσουμε. Ευχαριστούμε!'
    else
      'Thank you for staying at Villa Memaj.' || E'\n\n'
      || 'We hope you enjoyed your stay. We would appreciate an honest review of your experience:' || E'\n'
      || v_base || '/' || v_lang || '/review?token=' || new.review_token::text || E'\n\n'
      || 'If anything fell short, please contact us so we can look into it. Thank you!'
    end;
    insert into public.email_outbox (booking_id, kind, to_email, to_name, subject, body_text, scheduled_for, dedupe_key)
    values (new.id, 'booking_thank_you_review', new.guest_email, new.guest_name,
      case when v_lang='el' then 'Ευχαριστούμε για τη διαμονή σας στη Villa Memaj' else 'Thank you for staying at Villa Memaj' end,
      v_thanks, greatest(v_due, now()), 'booking:' || new.id::text || ':thank-you-review')
    on conflict (dedupe_key) where dedupe_key is not null do nothing;
  end if;

  return new;
end
$function$;

drop trigger if exists hotel_bookings_lifecycle_emails on public.hotel_bookings;
create trigger hotel_bookings_lifecycle_emails
  after insert or update of status, checked_out_at on public.hotel_bookings
  for each row execute function public.enqueue_booking_lifecycle_emails();

create or replace function public.enqueue_guest_channel_messages()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_due timestamptz;
  v_body text;
  v_kind text;
  v_suffix text;
  v_base text := 'https://villamemaj-2026-website.vercel.app';
  v_cfg public.hotel_house_policies%rowtype;
  v_room text;
  ch text;
  v_due_body text;
  v_status_changed boolean := TG_OP = 'INSERT';
  v_optin_changed boolean := TG_OP = 'INSERT';
  v_checked_out_changed boolean := TG_OP = 'INSERT';
begin
  if TG_OP = 'UPDATE' then
    v_status_changed := old.status is distinct from new.status;
    v_optin_changed := old.sms_opt_in is distinct from new.sms_opt_in
      or old.whatsapp_opt_in is distinct from new.whatsapp_opt_in;
    v_checked_out_changed := old.checked_out_at is distinct from new.checked_out_at;
  end if;

  select * into v_cfg from public.hotel_house_policies limit 1;
  select case when new.guest_language = 'el' then name_el else name_en end
    into v_room from public.hotel_rooms where id = new.room_id;

  if new.status = 'cancelled' and v_status_changed then
    update public.hotel_guest_message_outbox
    set status = 'skipped'
    where booking_id = new.id and status = 'pending'
      and kind in ('booking_reminder_14d', 'booking_reminder_7d', 'booking_welcome_24h', 'booking_thank_you_review');
    if v_status_changed then
      v_kind := 'booking_cancelled';
      v_body := case when new.guest_language = 'el'
        then 'Η κράτηση ' || coalesce(new.code, '') || ' σημειώθηκε ως ακυρωμένη. Για διευκρινίσεις, ελέγξτε το email σας ή επικοινωνήστε με τη Villa Memaj.'
        else 'Booking ' || coalesce(new.code, '') || ' has been marked as cancelled. Please check your email or contact Villa Memaj if you need clarification.'
      end;
    else
      return new;
    end if;
  elsif new.status in ('request', 'hold') then
    if not v_status_changed and not v_optin_changed then
      return new;
    end if;
    v_kind := 'booking_request_received';
    v_body := case when new.guest_language = 'el'
      then 'Villa Memaj: λάβαμε το αίτημα ' || coalesce(new.code, '') || '. Δεν αποτελεί ακόμη επιβεβαίωση κράτησης. Θα επικοινωνήσουμε μαζί σας.'
      else 'Villa Memaj: we received request ' || coalesce(new.code, '') || '. This is not yet a confirmed booking. Our team will follow up.'
    end;
  elsif new.status = 'confirmed' and v_status_changed then
    v_kind := 'booking_confirmed';
    v_body := case when new.guest_language = 'el'
      then 'Villa Memaj: η κράτηση ' || coalesce(new.code, '') || ' επιβεβαιώθηκε για ' || new.check_in || ' έως ' || new.check_out || '. Ελέγξτε το email σας για όρους και οδηγίες.'
      else 'Villa Memaj: booking ' || coalesce(new.code, '') || ' is confirmed for ' || new.check_in || ' to ' || new.check_out || '. Check your email for terms and arrival details.'
    end;
  elsif (new.status = 'checked_out' and v_status_changed)
     or (new.checked_out_at is not null and v_checked_out_changed) then
    v_kind := 'booking_thank_you_review';
    v_body := case when new.guest_language = 'el'
      then 'Villa Memaj: ευχαριστούμε για τη διαμονή σας! Θα λάβετε email με σύνδεσμο για αξιολόγηση.'
      else 'Villa Memaj: thank you for staying with us! An email with a review link will follow.'
    end;
  else
    return new;
  end if;

  if new.guest_phone is null or length(trim(new.guest_phone)) < 7 then
    return new;
  end if;

  foreach ch in array array['sms', 'whatsapp'] loop
    if (ch = 'sms' and new.sms_opt_in) or (ch = 'whatsapp' and new.whatsapp_opt_in) then
      insert into public.hotel_guest_message_outbox
        (booking_id, kind, channel, to_phone, body_text, dedupe_key)
      values
        (new.id, v_kind, ch, trim(new.guest_phone), v_body,
         'booking:' || new.id::text || ':' || ch || ':' || v_kind)
      on conflict (dedupe_key) do nothing;
    end if;
  end loop;

  -- Only schedule reminders for a newly confirmed booking, and only for future send times.
  if new.status = 'confirmed' and v_status_changed then
    foreach ch in array array['sms', 'whatsapp'] loop
      if (ch = 'sms' and new.sms_opt_in) or (ch = 'whatsapp' and new.whatsapp_opt_in) then
        foreach v_suffix in array array['14d','7d','24h'] loop
          v_due := case v_suffix
            when '14d' then (((new.check_in - 14) + time '09:00') at time zone 'Europe/Tirane')
            when '7d' then (((new.check_in - 7) + time '09:00') at time zone 'Europe/Tirane')
            else (((new.check_in - 1) + time '09:00') at time zone 'Europe/Tirane')
          end;
          if v_due > now() then
            v_due_body := case
              when v_suffix = '24h' and new.guest_language = 'el' then 'Villa Memaj: σας περιμένουμε αύριο. Άφιξη ' || new.check_in || '. Οδηγίες και τοπικές πληροφορίες έχουν σταλεί στο email σας.'
              when v_suffix = '24h' then 'Villa Memaj: we look forward to welcoming you tomorrow. Check-in date: ' || new.check_in || '. Arrival and local information have been emailed.'
              when new.guest_language = 'el' then 'Villa Memaj: υπενθύμιση κράτησης ' || coalesce(new.code, '') || '. Άφιξη ' || new.check_in || '. Για αλλαγές, επικοινωνήστε μαζί μας.'
              else 'Villa Memaj: reminder for booking ' || coalesce(new.code, '') || '. Check-in ' || new.check_in || '. Contact us if you need a change.'
            end;
            insert into public.hotel_guest_message_outbox
              (booking_id, kind, channel, to_phone, body_text, dedupe_key, scheduled_for)
            values
              (new.id, case v_suffix when '14d' then 'booking_reminder_14d' when '7d' then 'booking_reminder_7d' else 'booking_welcome_24h' end,
               ch, trim(new.guest_phone), v_due_body,
               'booking:' || new.id::text || ':' || ch || ':reminder:' || v_suffix, v_due)
            on conflict (dedupe_key) do nothing;
          end if;
        end loop;
      end if;
    end loop;
  end if;

  return new;
end
$function$;

drop trigger if exists hotel_bookings_guest_channel_messages on public.hotel_bookings;
create trigger hotel_bookings_guest_channel_messages
  after insert or update of status, checked_out_at, sms_opt_in, whatsapp_opt_in on public.hotel_bookings
  for each row execute function public.enqueue_guest_channel_messages();

-- Frontend uses this wrapper to record language and explicit message-channel opt-ins in the
-- same transaction as a booking request. The underlying request function retains its existing
-- rate limiting, honeypot checks and price-from-database validation.
create or replace function public.submit_booking_request_with_preferences(
  p_room_id uuid,
  p_rate_plan_id uuid,
  p_check_in date,
  p_check_out date,
  p_adults integer,
  p_children integer,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text,
  p_special_requests text,
  p_currency character,
  p_accepted_terms boolean,
  p_honeypot text,
  p_elapsed_ms integer,
  p_sms_opt_in boolean default false,
  p_whatsapp_opt_in boolean default false,
  p_guest_language text default 'en'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_result jsonb;
  v_booking_id uuid;
  v_consent boolean := coalesce(p_sms_opt_in, false) or coalesce(p_whatsapp_opt_in, false);
begin
  v_result := public.submit_booking_request(
    p_room_id, p_rate_plan_id, p_check_in, p_check_out,
    p_adults, p_children, p_guest_name, p_guest_email, p_guest_phone,
    p_special_requests, p_currency, p_accepted_terms, p_honeypot, p_elapsed_ms
  );

  if coalesce((v_result ->> 'ok')::boolean, false) is not true then
    return v_result;
  end if;

  v_booking_id := nullif(v_result -> 'booking' ->> 'booking_id', '')::uuid;
  if v_booking_id is not null then
    update public.hotel_bookings
    set sms_opt_in = coalesce(p_sms_opt_in, false),
        whatsapp_opt_in = coalesce(p_whatsapp_opt_in, false),
        messaging_consent_at = case when v_consent then now() else null end,
        messaging_consent_source = case when v_consent then 'direct_booking_form' else null end,
        guest_language = case when p_guest_language in ('el','en','fr','sq','de') then p_guest_language else 'en' end
    where id = v_booking_id;
  end if;

  return v_result;
end
$function$;

revoke all on function public.submit_booking_request_with_preferences(uuid, uuid, date, date, integer, integer, text, text, text, text, character, boolean, text, integer, boolean, boolean, text) from public;
grant execute on function public.submit_booking_request_with_preferences(uuid, uuid, date, date, integer, integer, text, text, text, text, character, boolean, text, integer, boolean, boolean, text) to anon, authenticated, service_role;


-- A just-submitted booking may flush only its own fresh, due email rows. This enables prompt
-- confirmation/owner notifications without exposing a public endpoint that drains the whole queue.
create or replace function public.claim_outbox_emails_for_booking(p_booking_id uuid, p_limit integer default 10)
returns setof public.email_outbox
language plpgsql
security definer
set search_path = public
as $function$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role required' using errcode = '42501';
  end if;

  update public.email_outbox
  set status = 'pending'
  where booking_id = p_booking_id and status = 'sending'
    and claimed_at < now() - interval '10 minutes';

  return query
  with batch as (
    select e.id
    from public.email_outbox e
    where e.booking_id = p_booking_id
      and e.status = 'pending'
      and e.scheduled_for <= now()
      and e.created_at > now() - interval '15 minutes'
    order by e.scheduled_for
    limit greatest(1, least(coalesce(p_limit, 10), 20))
    for update skip locked
  )
  update public.email_outbox e
  set status = 'sending', attempts = e.attempts + 1, claimed_at = now()
  from batch b
  where e.id = b.id
  returning e.*;
end
$function$;

revoke all on function public.claim_outbox_emails_for_booking(uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_outbox_emails_for_booking(uuid, integer) to service_role;


create or replace function public.claim_guest_messages_configured(p_limit integer default 20, p_channels text[] default array['sms','whatsapp'])
returns setof public.hotel_guest_message_outbox
language plpgsql
security definer
set search_path = public
as $function$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role required' using errcode = '42501';
  end if;

  update public.hotel_guest_message_outbox
  set status = 'pending'
  where status = 'sending' and claimed_at < now() - interval '10 minutes';

  return query
  with batch as (
    select id
    from public.hotel_guest_message_outbox
    where status = 'pending' and scheduled_for <= now()
      and channel = any(coalesce(p_channels, array[]::text[]))
    order by scheduled_for
    limit greatest(1, least(coalesce(p_limit, 20), 100))
    for update skip locked
  )
  update public.hotel_guest_message_outbox m
  set status = 'sending', attempts = m.attempts + 1, claimed_at = now()
  from batch b
  where m.id = b.id
  returning m.*;
end
$function$;

create or replace function public.claim_guest_messages_for_booking_configured(
  p_booking_id uuid,
  p_limit integer default 10,
  p_channels text[] default array['sms','whatsapp']
)
returns setof public.hotel_guest_message_outbox
language plpgsql
security definer
set search_path = public
as $function$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role required' using errcode = '42501';
  end if;

  return query
  with batch as (
    select id
    from public.hotel_guest_message_outbox
    where booking_id = p_booking_id
      and status = 'pending'
      and scheduled_for <= now()
      and created_at > now() - interval '15 minutes'
      and channel = any(coalesce(p_channels, array[]::text[]))
    order by scheduled_for
    limit greatest(1, least(coalesce(p_limit, 10), 20))
    for update skip locked
  )
  update public.hotel_guest_message_outbox m
  set status = 'sending', attempts = m.attempts + 1, claimed_at = now()
  from batch b
  where m.id = b.id
  returning m.*;
end
$function$;

revoke all on function public.claim_guest_messages_configured(integer, text[]) from public, anon, authenticated;
revoke all on function public.claim_guest_messages_for_booking_configured(uuid, integer, text[]) from public, anon, authenticated;
grant execute on function public.claim_guest_messages_configured(integer, text[]) to service_role;
grant execute on function public.claim_guest_messages_for_booking_configured(uuid, integer, text[]) to service_role;
