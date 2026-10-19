-- Do not reset an existing Supabase user's password when adding staff access.
-- New accounts still receive the initial password supplied by the owner/manager.
create or replace function public.admin_create_staff(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text
)
returns uuid
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
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

  select id into v_uid
  from auth.users
  where lower(email) = v_email;

  if v_uid is null then
    if p_password is null or length(p_password) < 8 then
      raise exception 'Password must be at least 8 characters for a new staff account';
    end if;

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
  end if;

  -- Existing auth.users credentials and verification state are left untouched.
  insert into public.hotel_staff_memberships (user_id, role, is_active, invited_by)
  values (v_uid, p_role, true, auth.uid())
  on conflict (user_id) do update
    set role = excluded.role, is_active = true;

  return v_uid;
end
$function$;
