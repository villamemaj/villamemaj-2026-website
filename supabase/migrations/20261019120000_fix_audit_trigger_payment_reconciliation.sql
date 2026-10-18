-- Fix the shared audit trigger so updates to every audited table can be recorded.
-- In particular, hotel_payment_transactions has an id but no code column.
create or replace function public.hotel_audit_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_before jsonb;
  v_after jsonb;
  v_entity_id text;
begin
  if TG_OP = 'UPDATE' then
    v_before := to_jsonb(old);
    v_after := to_jsonb(new);
    if v_before = v_after then
      return new;
    end if;

    v_entity_id := coalesce(v_after ->> 'id', v_after ->> 'code', 'unknown');
    insert into public.hotel_audit_log
      (actor_user_id, action, entity_type, entity_id, before_data, after_data)
    values
      (auth.uid(), 'update', TG_TABLE_NAME, v_entity_id, v_before, v_after);
    return new;
  elsif TG_OP = 'DELETE' then
    v_before := to_jsonb(old);
    v_entity_id := coalesce(v_before ->> 'id', v_before ->> 'code', 'unknown');
    insert into public.hotel_audit_log
      (actor_user_id, action, entity_type, entity_id, before_data)
    values
      (auth.uid(), 'delete', TG_TABLE_NAME, v_entity_id, v_before);
    return old;
  elsif TG_OP = 'INSERT' then
    v_after := to_jsonb(new);
    v_entity_id := coalesce(v_after ->> 'id', v_after ->> 'code', 'unknown');
    insert into public.hotel_audit_log
      (actor_user_id, action, entity_type, entity_id, after_data)
    values
      (auth.uid(), 'create', TG_TABLE_NAME, v_entity_id, v_after);
    return new;
  end if;

  return null;
end
$function$;

revoke all on function public.hotel_audit_changes() from public, anon, authenticated;
grant execute on function public.hotel_audit_changes() to service_role;
