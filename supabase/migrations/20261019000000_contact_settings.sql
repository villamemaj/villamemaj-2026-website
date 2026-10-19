-- Contact settings for the public site + close an anonymous data leak.
--
-- Before this migration the entire hotel_house_policies row was readable with
-- the public (anon) key because the table had a full table-level SELECT grant
-- and a `using (true)` RLS policy. That exposed notification_emails (the
-- owner's private inbox) to anyone. Here we narrow anonymous access to the
-- contact columns the public site actually needs.

alter table public.hotel_house_policies
  add column if not exists address_el text,
  add column if not exists address_en text;

-- Drop the blanket anonymous grant, then re-grant only the public columns.
-- Authenticated staff keep full read/write access (RLS still restricts writes
-- to owner/manager via house_policies_manager_update).
revoke all on public.hotel_house_policies from anon;

grant select (contact_email, contact_phone, address_el, address_en)
  on public.hotel_house_policies to anon;
