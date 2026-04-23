alter table public.reminders
drop constraint if exists reminders_schedule_kind_check;

alter table public.reminders
add constraint reminders_schedule_kind_check
check (schedule_kind in ('one_time', 'daily', 'weekly'));

drop function if exists public.create_reminder_mvp(uuid, uuid, uuid, text, text, timestamptz, uuid, jsonb);

create or replace function public.create_reminder_mvp(
  p_space_id uuid,
  p_subject_id uuid default null,
  p_event_type_id uuid default null,
  p_title text default null,
  p_notes text default null,
  p_due_at timestamptz default null,
  p_assigned_to uuid default null,
  p_payload jsonb default '{}'::jsonb,
  p_schedule_kind text default 'one_time'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role text;
  v_reminder_id uuid;
  v_schedule_kind text := coalesce(nullif(trim(p_schedule_kind), ''), 'one_time');
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_role := public.space_role(p_space_id);
  if v_role not in ('owner', 'caregiver') then
    raise exception 'Only caregivers and owners can create reminders';
  end if;

  if trim(coalesce(p_title, '')) = '' then
    raise exception 'Reminder title is required';
  end if;

  if p_due_at is null then
    raise exception 'Reminder due date is required';
  end if;

  if v_schedule_kind not in ('one_time', 'daily', 'weekly') then
    raise exception 'Reminder repeat option is invalid';
  end if;

  if p_subject_id is not null and not exists (
    select 1
    from public.subjects
    where id = p_subject_id
      and space_id = p_space_id
      and status = 'active'
  ) then
    raise exception 'Subject was not found for this space';
  end if;

  if p_event_type_id is not null and not exists (
    select 1
    from public.event_types
    where id = p_event_type_id
      and space_id = p_space_id
      and is_active = true
  ) then
    raise exception 'Event type was not found for this space';
  end if;

  if p_assigned_to is not null and not exists (
    select 1
    from public.space_memberships
    where space_id = p_space_id
      and user_id = p_assigned_to
      and status = 'active'
  ) then
    raise exception 'Assigned user is not an active member of this space';
  end if;

  insert into public.reminders (
    space_id,
    subject_id,
    event_type_id,
    created_by,
    assigned_to,
    title,
    notes,
    due_at,
    schedule_kind,
    payload
  )
  values (
    p_space_id,
    p_subject_id,
    p_event_type_id,
    v_user_id,
    p_assigned_to,
    trim(p_title),
    nullif(trim(coalesce(p_notes, '')), ''),
    p_due_at,
    v_schedule_kind,
    coalesce(p_payload, '{}'::jsonb)
  )
  returning id into v_reminder_id;

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
    p_space_id,
    v_user_id,
    'reminder',
    v_reminder_id,
    'created',
    jsonb_build_object(
      'title', trim(p_title),
      'due_at', p_due_at,
      'assigned_to', p_assigned_to,
      'schedule_kind', v_schedule_kind
    ),
    jsonb_build_object('event_type_id', p_event_type_id)
  );

  return v_reminder_id;
end;
$$;

create or replace function public.process_due_reminders_mvp(p_limit integer default 50)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_processed integer := 0;
  v_reminder record;
begin
  if coalesce(auth.role(), '') not in ('service_role', 'supabase_admin') then
    raise exception 'Only service role can process reminders';
  end if;

  for v_reminder in
    select *
    from public.reminders
    where status = 'scheduled'
      and due_at <= now()
    order by due_at asc
    limit greatest(coalesce(p_limit, 50), 1)
    for update skip locked
  loop
    update public.reminders
    set
      status = case when v_reminder.schedule_kind = 'one_time' then 'sent' else 'scheduled' end,
      due_at = case
        when v_reminder.schedule_kind = 'daily' then v_reminder.due_at + interval '1 day'
        when v_reminder.schedule_kind = 'weekly' then v_reminder.due_at + interval '1 week'
        else v_reminder.due_at
      end,
      updated_at = now()
    where id = v_reminder.id;

    if v_reminder.assigned_to is not null then
      with inserted_notification as (
        insert into public.notifications (
          space_id,
          recipient_user_id,
          type,
          reminder_id,
          title,
          body,
          status
        )
        values (
          v_reminder.space_id,
          v_reminder.assigned_to,
          'reminder_due',
          v_reminder.id,
          v_reminder.title,
          coalesce(v_reminder.notes, 'A reminder is due now.'),
          'pending'
        )
        returning id
      )
      insert into public.notification_deliveries (
        notification_id,
        channel,
        status,
        delivered_at,
        metadata
      )
      select
        inserted_notification.id,
        'in_app',
        'delivered',
        now(),
        jsonb_build_object('source', 'process_due_reminders_mvp', 'schedule_kind', v_reminder.schedule_kind)
      from inserted_notification;
    else
      with recipients as (
        select sm.user_id
        from public.space_memberships sm
        left join public.notification_preferences np
          on np.user_id = sm.user_id
         and np.space_id = v_reminder.space_id
         and np.channel = 'in_app'
        where sm.space_id = v_reminder.space_id
          and sm.status = 'active'
          and coalesce(np.enabled, true) = true
          and coalesce(np.reminder_due_enabled, true) = true
      ),
      inserted_notifications as (
        insert into public.notifications (
          space_id,
          recipient_user_id,
          type,
          reminder_id,
          title,
          body,
          status
        )
        select
          v_reminder.space_id,
          recipients.user_id,
          'reminder_due',
          v_reminder.id,
          v_reminder.title,
          coalesce(v_reminder.notes, 'A reminder is due now.'),
          'pending'
        from recipients
        returning id
      )
      insert into public.notification_deliveries (
        notification_id,
        channel,
        status,
        delivered_at,
        metadata
      )
      select
        inserted_notifications.id,
        'in_app',
        'delivered',
        now(),
        jsonb_build_object('source', 'process_due_reminders_mvp', 'schedule_kind', v_reminder.schedule_kind)
      from inserted_notifications;
    end if;

    v_processed := v_processed + 1;
  end loop;

  return v_processed;
end;
$$;

revoke all on function public.create_reminder_mvp(uuid, uuid, uuid, text, text, timestamptz, uuid, jsonb, text) from public;
grant execute on function public.create_reminder_mvp(uuid, uuid, uuid, text, text, timestamptz, uuid, jsonb, text) to authenticated;

revoke all on function public.process_due_reminders_mvp(integer) from public;
grant execute on function public.process_due_reminders_mvp(integer) to service_role;
