-- Claim queue records for a single booking so immediate notifications can be dispatched
-- after booking submission or a verified Stripe webhook without draining unrelated mail.

create or replace function public.claim_booking_email_outbox(p_booking_id uuid, p_limit integer default 20)
returns setof public.email_outbox
language plpgsql
security definer
set search_path = public
as $function$
begin
  if coalesce(auth.role(),'') <> 'service_role' then
    raise exception 'service_role required' using errcode='42501';
  end if;
  if p_booking_id is null then
    raise exception 'booking id required' using errcode='22023';
  end if;

  update public.email_outbox
  set status='pending'
  where booking_id=p_booking_id and status='sending' and claimed_at < now()-interval '10 minutes';

  return query
  with batch as (
    select id from public.email_outbox
    where booking_id=p_booking_id and status='pending' and scheduled_for<=now()
    order by scheduled_for
    limit greatest(1,least(coalesce(p_limit,20),100))
    for update skip locked
  )
  update public.email_outbox e
  set status='sending', attempts=e.attempts+1, claimed_at=now()
  from batch b where e.id=b.id
  returning e.*;
end
$function$;

create or replace function public.claim_booking_sms_outbox(p_booking_id uuid, p_limit integer default 20)
returns setof public.sms_outbox
language plpgsql
security definer
set search_path = public
as $function$
begin
  if coalesce(auth.role(),'') <> 'service_role' then
    raise exception 'service_role required' using errcode='42501';
  end if;
  if p_booking_id is null then
    raise exception 'booking id required' using errcode='22023';
  end if;
  update public.sms_outbox
  set status='pending'
  where booking_id=p_booking_id and status='sending' and claimed_at < now()-interval '10 minutes';
  return query
  with batch as (
    select id from public.sms_outbox
    where booking_id=p_booking_id and status='pending' and scheduled_for<=now()
    order by scheduled_for limit greatest(1,least(coalesce(p_limit,20),100))
    for update skip locked
  )
  update public.sms_outbox s
  set status='sending',attempts=s.attempts+1,claimed_at=now()
  from batch b where s.id=b.id returning s.*;
end
$function$;

create or replace function public.claim_booking_owner_notifications(p_booking_id uuid, p_limit integer default 20)
returns setof public.owner_notification_outbox
language plpgsql
security definer
set search_path = public
as $function$
begin
  if coalesce(auth.role(),'') <> 'service_role' then
    raise exception 'service_role required' using errcode='42501';
  end if;
  if p_booking_id is null then
    raise exception 'booking id required' using errcode='22023';
  end if;
  update public.owner_notification_outbox
  set status='pending'
  where booking_id=p_booking_id and status='sending' and claimed_at < now()-interval '10 minutes';
  return query
  with batch as (
    select id from public.owner_notification_outbox
    where booking_id=p_booking_id and status='pending' and scheduled_for<=now()
    order by scheduled_for limit greatest(1,least(coalesce(p_limit,20),100))
    for update skip locked
  )
  update public.owner_notification_outbox o
  set status='sending',attempts=o.attempts+1,claimed_at=now()
  from batch b where o.id=b.id returning o.*;
end
$function$;

revoke all on function public.claim_booking_email_outbox(uuid,integer) from public, anon, authenticated;
revoke all on function public.claim_booking_sms_outbox(uuid,integer) from public, anon, authenticated;
revoke all on function public.claim_booking_owner_notifications(uuid,integer) from public, anon, authenticated;
grant execute on function public.claim_booking_email_outbox(uuid,integer) to service_role;
grant execute on function public.claim_booking_sms_outbox(uuid,integer) to service_role;
grant execute on function public.claim_booking_owner_notifications(uuid,integer) to service_role;
