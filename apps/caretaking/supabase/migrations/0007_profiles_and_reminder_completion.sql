alter table public.profiles
  add column if not exists preferred_name text,
  add column if not exists legal_name text,
  add column if not exists relationship_label text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    preferred_name,
    legal_name,
    relationship_label,
    avatar_url,
    timezone
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'Caregiver'),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'preferred_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'legal_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'relationship_label', '')), ''),
    new.raw_user_meta_data ->> 'avatar_url',
    coalesce(new.raw_user_meta_data ->> 'timezone', 'UTC')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.complete_reminder_mvp(p_reminder_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_reminder public.reminders%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_reminder
  from public.reminders
  where id = p_reminder_id
  for update;

  if not found then
    return false;
  end if;

  if not public.is_space_member(v_reminder.space_id) then
    raise exception 'Reminder was not found for this space';
  end if;

  if v_reminder.status = 'completed' then
    return true;
  end if;

  if v_reminder.status not in ('scheduled', 'sent') then
    return false;
  end if;

  update public.reminders
  set
    status = 'completed',
    completed_at = now(),
    updated_at = now()
  where id = p_reminder_id;

  insert into public.audit_logs (
    space_id,
    actor_user_id,
    entity_type,
    entity_id,
    action,
    changes,
    context
  )
  values (
    v_reminder.space_id,
    v_user_id,
    'reminder',
    p_reminder_id,
    'completed',
    jsonb_build_object('previous_status', v_reminder.status, 'completed_at', now()),
    jsonb_build_object('source', 'complete_reminder_mvp')
  );

  return true;
end;
$$;

revoke all on function public.complete_reminder_mvp(uuid) from public;
grant execute on function public.complete_reminder_mvp(uuid) to authenticated;
