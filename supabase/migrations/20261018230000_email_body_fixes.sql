-- Fix two issues in the booking notification bodies found while verifying:
--   1. "Balance on arrival" must be total minus deposit. hotel_bookings.balance_due means
--      "money not yet received" and reads as the full total before any payment is recorded,
--      which is not what a guest should be told.
--   2. "1 children" -> "1 child".
-- CREATE OR REPLACE keeps the existing trigger binding and privileges.

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
  v_children int;
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
  v_children := coalesce(new.children, 0);
  v_total := to_char(coalesce(new.total_price, 0), 'FM9999999990.00');
  v_deposit := to_char(coalesce(new.deposit_amount, 0), 'FM9999999990.00');
  -- What the guest still owes on arrival, after the deposit.
  v_balance := to_char(
    greatest(coalesce(new.total_price, 0) - coalesce(new.deposit_amount, 0), 0),
    'FM9999999990.00'
  );

  v_guest_body :=
    'Thank you for your booking request.' || E'\n' ||
    'Ευχαριστούμε για το αίτημα κράτησής σας.' || E'\n\n' ||
    'Reference / Κωδικός: ' || new.code || E'\n' ||
    'Room / Δωμάτιο: ' || coalesce(v_room_en, '') || ' — ' || coalesce(v_room_el, '') || E'\n' ||
    'Dates / Ημερομηνίες: ' || new.check_in || ' → ' || new.check_out ||
      ' (' || v_nights || ' nights / νύχτες)' || E'\n' ||
    'Guests / Άτομα: ' || new.adults || ' adults, ' || v_children ||
      case when v_children = 1 then ' child' else ' children' end || E'\n' ||
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
    'Guests: ' || new.adults || ' adults, ' || v_children ||
      case when v_children = 1 then ' child' else ' children' end || E'\n' ||
    'Total: ' || new.currency_code || ' ' || v_total ||
      '   Deposit: ' || new.currency_code || ' ' || v_deposit ||
      '   Balance on arrival: ' || new.currency_code || ' ' || v_balance || E'\n' ||
    'Paid so far: ' || new.currency_code || ' ' ||
      to_char(coalesce(new.amount_paid, 0), 'FM9999999990.00') || E'\n' ||
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
