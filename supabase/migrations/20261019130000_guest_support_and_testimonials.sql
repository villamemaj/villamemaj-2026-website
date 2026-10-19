-- Guest support, privacy-conscious chat transcripts, and first-party testimonial moderation.

create table if not exists public.guest_support_conversations (
  id uuid primary key default gen_random_uuid(),
  locale text not null default 'en' check (locale in ('el','en','fr','sq','de','it')),
  status text not null default 'open' check (status in ('open','waiting_staff','resolved','closed')),
  ai_provider text,
  guest_contact_email text,
  requested_human boolean not null default false,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists guest_support_conversations_open_idx on public.guest_support_conversations (status, last_message_at desc);

create table if not exists public.guest_support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.guest_support_conversations(id) on delete cascade,
  role text not null check (role in ('guest','assistant','staff','system')),
  message text not null check (length(message) between 1 and 6000),
  ai_provider text,
  needs_staff boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists guest_support_messages_conversation_idx on public.guest_support_messages (conversation_id, created_at);

create table if not exists public.support_rate_limits (
  fingerprint_hash text primary key check (length(fingerprint_hash) between 32 and 128),
  window_started_at timestamptz not null default now(),
  hits integer not null default 0
);

alter table public.guest_support_conversations enable row level security;
alter table public.guest_support_messages enable row level security;
alter table public.support_rate_limits enable row level security;
revoke all on public.guest_support_conversations, public.guest_support_messages, public.support_rate_limits from public, anon, authenticated;
grant all on public.guest_support_conversations, public.guest_support_messages, public.support_rate_limits to service_role;

create or replace function public.consume_support_rate_limit(p_fingerprint_hash text, p_window_seconds integer default 60, p_max_hits integer default 8)
returns boolean
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_hits integer;
begin
  if coalesce(auth.role(),'') <> 'service_role' then
    raise exception 'service_role required' using errcode='42501';
  end if;
  if p_fingerprint_hash is null or length(p_fingerprint_hash) < 32 or length(p_fingerprint_hash) > 128 then
    raise exception 'Invalid rate-limit fingerprint' using errcode='22023';
  end if;
  insert into public.support_rate_limits (fingerprint_hash,window_started_at,hits)
  values (p_fingerprint_hash,now(),1)
  on conflict (fingerprint_hash) do update
  set window_started_at = case
        when public.support_rate_limits.window_started_at < now() - make_interval(secs => greatest(1,least(coalesce(p_window_seconds,60),3600)))
          then now()
        else public.support_rate_limits.window_started_at
      end,
      hits = case
        when public.support_rate_limits.window_started_at < now() - make_interval(secs => greatest(1,least(coalesce(p_window_seconds,60),3600)))
          then 1
        else public.support_rate_limits.hits + 1
      end
  returning hits into v_hits;
  return v_hits <= greatest(1,least(coalesce(p_max_hits,8),100));
end
$function$;
revoke all on function public.consume_support_rate_limit(text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_support_rate_limit(text,integer,integer) to service_role;

-- First-party testimonials: only explicitly consented, staff-approved items are public.
-- Booking.com API review text is not copied into this table.
create table if not exists public.guest_testimonials (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (length(trim(display_name)) between 1 and 120),
  locale text not null default 'en' check (locale in ('el','en','fr','sq','de','it')),
  rating integer not null check (rating between 1 and 5),
  title text not null default '' check (length(title) <= 160),
  body text not null check (length(body) between 10 and 3000),
  source text not null default 'direct_guest' check (source in ('direct_guest')),
  consent_to_publish boolean not null default false,
  is_published boolean not null default false,
  submitted_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid,
  moderation_note text
);
create index if not exists guest_testimonials_public_idx on public.guest_testimonials (is_published, submitted_at desc);
alter table public.guest_testimonials enable row level security;
revoke all on public.guest_testimonials from public, anon, authenticated;
grant select on public.guest_testimonials to anon, authenticated;
grant select, insert, update on public.guest_testimonials to service_role;
drop policy if exists guest_testimonials_public_published on public.guest_testimonials;
create policy guest_testimonials_public_published
  on public.guest_testimonials for select to anon, authenticated
  using (is_published = true and consent_to_publish = true);

grant select, update on public.guest_support_conversations to authenticated;
grant select, insert on public.guest_support_messages to authenticated;
create policy guest_support_staff_read_conversations
  on public.guest_support_conversations for select to authenticated
  using (private.has_hotel_role(array['owner','manager','receptionist']));
create policy guest_support_staff_update_conversations
  on public.guest_support_conversations for update to authenticated
  using (private.has_hotel_role(array['owner','manager']))
  with check (private.has_hotel_role(array['owner','manager']));
create policy guest_support_staff_read_messages
  on public.guest_support_messages for select to authenticated
  using (private.has_hotel_role(array['owner','manager','receptionist']));
create policy guest_support_staff_insert_messages
  on public.guest_support_messages for insert to authenticated
  with check (private.has_hotel_role(array['owner','manager','receptionist']) and role = 'staff');

grant select, update on public.guest_testimonials to authenticated;
create policy guest_testimonials_staff_read
  on public.guest_testimonials for select to authenticated
  using (private.has_hotel_role(array['owner','manager']));
create policy guest_testimonials_staff_update
  on public.guest_testimonials for update to authenticated
  using (private.has_hotel_role(array['owner','manager']))
  with check (private.has_hotel_role(array['owner','manager']));
