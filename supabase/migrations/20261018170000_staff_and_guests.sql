-- ============================================================
-- Phase: staff accounts + guests management
-- - Secure, owner/manager-only server functions to provision staff
--   logins (no client-side service-role access, no self-signup).
-- - Owner/manager can list staff with emails (auth schema is not
--   readable from the API otherwise).
-- - Guests: allow staff to create/annotate guest profiles.
-- - auth.users rows are created with every GoTrue token column
--   defaulted (NULLs there break password login with a 500).
-- ============================================================

-- ---------- Helper: mint a login + membership ----------
create or replace function public.admin_create_staff(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid;
  v_email text := lower(trim(p_email));
begin
  if not private.has_hotel_role(array['owner','manager']) then
    raise exception 'Not authorised to provision staff';
  end if;
  if p_role not in ('owner','manager','receptionist','housekeeping','accountant') then
    raise exception 'Invalid role';
  end if;
  if p_role in ('owner','manager') and not private.has_hotel_role(array['owner']) then
    raise exception 'Only the owner can grant owner or manager roles';
  end if;
  if v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'A valid email is required';
  end if;
  if p_password is null or length(p_password) < 8 then
    raise exception 'Password must be at least 8 characters';
  end if;

  select id into v_uid from auth.users where lower(email) = v_email;

  if v_uid is null then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change, email_change_token_new,
      email_change_token_current, phone_change, phone_change_token,
      reauthentication_token, is_super_admin, is_sso_user, is_anonymous,
      created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      v_email, extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', coalesce(nullif(trim(p_full_name), ''), v_email)),
      '', '', '', '', '', '', '', '', false, false, false,
      now(), now()
    )
    returning id into v_uid;

    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      v_uid::text, v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
      'email', now(), now(), now()
    )
    on conflict do nothing;
  else
    update auth.users
    set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        confirmation_token = coalesce(confirmation_token, ''),
        recovery_token = coalesce(recovery_token, ''),
        email_change = coalesce(email_change, ''),
        email_change_token_new = coalesce(email_change_token_new, ''),
        updated_at = now()
    where id = v_uid;
  end if;

  insert into public.hotel_staff_memberships (user_id, role, is_active, invited_by)
  values (v_uid, p_role, true, auth.uid())
  on conflict (user_id) do update
    set role = excluded.role, is_active = true;

  return v_uid;
end $$;

create or replace function public.admin_set_staff_role(p_user_id uuid, p_role text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not private.has_hotel_role(array['owner','manager']) then
    raise exception 'Not authorised';
  end if;
  if p_role not in ('owner','manager','receptionist','housekeeping','accountant') then
    raise exception 'Invalid role';
  end if;
  if p_role in ('owner','manager') and not private.has_hotel_role(array['owner']) then
    raise exception 'Only the owner can grant owner or manager roles';
  end if;
  if not exists (select 1 from public.hotel_staff_memberships where user_id = p_user_id) then
    raise exception 'Staff member not found';
  end if;

  update public.hotel_staff_memberships set role = p_role where user_id = p_user_id;
end $$;

create or replace function public.admin_set_staff_active(p_user_id uuid, p_active boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not private.has_hotel_role(array['owner','manager']) then
    raise exception 'Not authorised';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You cannot deactivate your own account';
  end if;
  if not private.has_hotel_role(array['owner'])
     and exists (select 1 from public.hotel_staff_memberships where user_id = p_user_id and role in ('owner','manager')) then
    raise exception 'Only the owner can manage owner or manager accounts';
  end if;

  update public.hotel_staff_memberships set is_active = p_active where user_id = p_user_id;
end $$;

create or replace function public.admin_list_staff()
returns table (user_id uuid, email text, full_name text, role text, is_active boolean, created_at timestamptz)
language sql security definer set search_path = public stable as $$
  select m.user_id,
         u.email::text,
         coalesce(u.raw_user_meta_data->>'full_name', u.email::text),
         m.role,
         m.is_active,
         m.created_at
  from public.hotel_staff_memberships m
  join auth.users u on u.id = m.user_id
  where private.has_hotel_role(array['owner','manager'])
  order by m.created_at;
$$;

grant execute on function public.admin_create_staff(text, text, text, text) to authenticated;
grant execute on function public.admin_set_staff_role(uuid, text) to authenticated;
grant execute on function public.admin_set_staff_active(uuid, boolean) to authenticated;
grant execute on function public.admin_list_staff() to authenticated;

-- ---------- Guests: staff can create profiles ----------
drop policy if exists guests_staff_insert on public.guests;
create policy guests_staff_insert on public.guests for insert to authenticated
  with check (private.has_hotel_role(array['owner','manager','receptionist']));

grant insert on public.guests to authenticated;
