-- Fix GoTrue-required columns left NULL by the manual auth.users insert in
-- 20261018150000_hotel_platform_v2.sql. NULL values in these token columns make
-- GoTrue fail with 500 "Database error querying schema" on every password login.
-- Idempotent: safe to run on projects where the owner row already exists.

update auth.users
set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change = coalesce(email_change, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  phone_change = coalesce(phone_change, ''),
  phone_change_token = coalesce(phone_change_token, ''),
  reauthentication_token = coalesce(reauthentication_token, ''),
  is_super_admin = coalesce(is_super_admin, false),
  is_sso_user = coalesce(is_sso_user, false),
  is_anonymous = coalesce(is_anonymous, false)
where email = 'agapitosolgakalafata@gmail.com'
  and (
    confirmation_token is null
    or recovery_token is null
    or email_change is null
    or email_change_token_new is null
    or is_super_admin is null
  );
