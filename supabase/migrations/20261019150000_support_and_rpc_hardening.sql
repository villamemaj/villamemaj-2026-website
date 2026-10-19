-- Harden privileged automation RPCs and bind guest support conversations to the
-- rate-limit fingerprint of the browser/IP that created them.

alter table public.guest_support_conversations
  add column if not exists client_fingerprint_hash text not null default 'legacy-unbound';

create index if not exists guest_support_conversations_fingerprint_idx
  on public.guest_support_conversations (client_fingerprint_hash, last_message_at desc);

-- Server-only email queue RPCs: explicitly require the service role in the function body,
-- not merely through grants, and remove EXECUTE from all browser-facing roles.
do $block$
declare
  v_def text;
begin
  select pg_get_functiondef('public.claim_outbox_emails(integer)'::regprocedure) into v_def;
  if position('service_role required' in v_def) = 0 then
    v_def := replace(
      v_def,
      E'begin\n  -- Reclaim anything',
      E'begin\n  if coalesce(auth.role(), '''') <> ''service_role'' then\n    raise exception ''service_role required'' using errcode = ''42501'';\n  end if;\n\n  -- Reclaim anything'
    );
    execute v_def;
  end if;

  select pg_get_functiondef('public.finish_outbox_email(uuid,boolean,text,text,text)'::regprocedure) into v_def;
  if position('service_role required' in v_def) = 0 then
    v_def := replace(
      v_def,
      E'AS $function$\nbegin\n',
      E'AS $function$\nbegin\n  if coalesce(auth.role(), '''') <> ''service_role'' then\n    raise exception ''service_role required'' using errcode = ''42501'';\n  end if;\n'
    );
    execute v_def;
  end if;

  -- Errors are logged privately to booking_intake_attempts but not returned to the guest.
  select pg_get_functiondef('public.quote_booking(uuid,uuid,date,date,character,integer,integer)'::regprocedure) into v_def;
  v_def := replace(v_def,
    'return jsonb_build_object(''available'', false, ''error'', SQLERRM);',
    'return jsonb_build_object(''available'', false, ''error'', ''Unable to calculate the quote. Please try other dates or contact the property.'');');
  execute v_def;

  select pg_get_functiondef('public.submit_booking_request(uuid,uuid,date,date,integer,integer,text,text,text,text,character,boolean,text,integer)'::regprocedure) into v_def;
  v_def := replace(v_def,
    'return jsonb_build_object(''ok'', false, ''reason'', ''invalid'', ''message'', sqlerrm);',
    'return jsonb_build_object(''ok'', false, ''reason'', ''invalid'', ''message'', ''The booking request could not be completed. Please check your dates or contact the property.'');');
  execute v_def;

  -- Use Albanian local calendar dates for reminders and avoid hard-coding unverified
  -- town/attraction names into a guest welcome message.
  select pg_get_functiondef('public.queue_guest_lifecycle_messages()'::regprocedure) into v_def;
  v_def := replace(v_def, 'current_date', '(now() at time zone ''Europe/Tirane'')::date');
  v_def := replace(v_def,
    'Explore Vlorë and the Albanian Riviera: the Lungomare waterfront, local beaches, the Zvernec Lagoon and Monastery, and day trips toward Llogara National Park. Check current opening times, weather and transport locally. Distances and transport options depend on the exact itinerary.',
    'Explore local beaches, waterfronts, markets and natural or cultural sights near the property. Ask us for verified recommendations and current travel times based on your stay. Opening hours and transport can change by season.');
  execute v_def;
end
$block$;

revoke all on function public.claim_outbox_emails(integer) from public, anon, authenticated;
grant execute on function public.claim_outbox_emails(integer) to service_role;
revoke all on function public.finish_outbox_email(uuid,boolean,text,text,text) from public, anon, authenticated;
grant execute on function public.finish_outbox_email(uuid,boolean,text,text,text) to service_role;
revoke all on function public.enqueue_booking_emails() from public, anon, authenticated;
revoke all on function public.enqueue_guest_booking_status_message() from public, anon, authenticated;
revoke all on function public.enqueue_owner_booking_event() from public, anon, authenticated;
