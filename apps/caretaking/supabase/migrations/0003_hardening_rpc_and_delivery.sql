create table if not exists public.invite_deliveries (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null references public.space_invites (id) on delete cascade,
  channel text not null check (channel in ('email')),
  provider text,
  provider_message_id text,
  status text not null check (status in ('queued', 'sent', 'delivered', 'failed')),
  attempted_at timestamptz not null default now(),
  delivered_at timestamptz,
  error_code text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists invite_deliveries_invite_idx on public.invite_deliveries (invite_id, attempted_at desc);
create index if not exists invite_deliveries_status_idx on public.invite_deliveries (status, attempted_at desc);

revoke select (token_hash) on public.space_invites from public;
revoke select (token_hash) on public.space_invites from anon;
revoke select (token_hash) on public.space_invites from authenticated;

create or replace function public.slugify_text(value text)
returns text
language sql
immutable
as $$
  select nullif(trim(both '-' from regexp_replace(lower(coalesce(value, '')), '[^a-z0-9]+', '-', 'g')), '');
$$;

create or replace function public.create_space_mvp(p_name text, p_subject_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_space_id uuid;
  v_owner_role_id uuid;
  v_slug_base text;
  v_slug text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if trim(coalesce(p_name, '')) = '' then
    raise exception 'Space name is required';
  end if;

  select id into v_owner_role_id
  from public.roles
  where key = 'owner';

  if v_owner_role_id is null then
    raise exception 'Owner role is not seeded';
  end if;

  v_slug_base := coalesce(public.slugify_text(p_name), 'space');
  v_slug := v_slug_base;

  while exists (select 1 from public.spaces where slug = v_slug) loop
    v_slug := v_slug_base || '-' || substring(encode(gen_random_bytes(3), 'hex') from 1 for 6);
  end loop;

  insert into public.spaces (name, slug, created_by)
  values (trim(p_name), v_slug, v_user_id)
  returning id into v_space_id;

  insert into public.space_memberships (space_id, user_id, role_id, status)
  values (v_space_id, v_user_id, v_owner_role_id, 'active');

  if trim(coalesce(p_subject_name, '')) <> '' then
    insert into public.subjects (space_id, name, is_primary, created_by)
    values (v_space_id, trim(p_subject_name), true, v_user_id);
  end if;

  insert into public.event_types (
    space_id,
    key,
    name,
    description,
    icon,
    color,
    schema,
    default_notify,
    sort_order,
    created_by
  )
  values
    (
      v_space_id,
      'check_in',
      'Check-in',
      'A general status update for shared caregiving.',
      'pulse',
      'teal',
      jsonb_build_object(
        'fields',
        jsonb_build_array(
          jsonb_build_object('key', 'note', 'label', 'Note', 'type', 'text', 'multiline', true)
        )
      ),
      true,
      0,
      v_user_id
    ),
    (
      v_space_id,
      'completed_task',
      'Completed task',
      'A generic record that a caregiving task was completed.',
      'check',
      'green',
      jsonb_build_object(
        'fields',
        jsonb_build_array(
          jsonb_build_object('key', 'context', 'label', 'Context', 'type', 'text', 'multiline', true)
        )
      ),
      true,
      1,
      v_user_id
    ),
    (
      v_space_id,
      'observation',
      'Observation',
      'A generic observation worth sharing with the other caregiver.',
      'eye',
      'amber',
      jsonb_build_object(
        'fields',
        jsonb_build_array(
          jsonb_build_object('key', 'details', 'label', 'Details', 'type', 'text', 'multiline', true)
        )
      ),
      true,
      2,
      v_user_id
    );

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
    v_space_id,
    v_user_id,
    'space',
    v_space_id,
    'created',
    jsonb_build_object('name', trim(p_name)),
    jsonb_build_object('seeded_event_types', jsonb_build_array('check_in', 'completed_task', 'observation'))
  );

  return v_space_id;
end;
$$;

create or replace function public.create_invite_mvp(
  p_space_id uuid,
  p_email text,
  p_role_key text,
  p_token_hash text,
  p_expires_at timestamptz
)
returns table (invite_id uuid, email text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role_id uuid;
  v_invite_id uuid;
  v_invite_email text;
  v_invite_expires_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if public.space_role(p_space_id) <> 'owner' then
    raise exception 'Only owners can invite members';
  end if;

  if exists (
    select 1
    from public.space_invites si
    where si.space_id = p_space_id
      and lower(si.email) = lower(trim(p_email))
      and si.status = 'pending'
  ) then
    raise exception 'A pending invite already exists for this email';
  end if;

  select id into v_role_id
  from public.roles
  where key = p_role_key;

  if v_role_id is null then
    raise exception 'Invalid role key';
  end if;

  insert into public.space_invites as si (
    space_id,
    email,
    role_id,
    invited_by,
    token_hash,
    expires_at
  )
  values (
    p_space_id,
    lower(trim(p_email)),
    v_role_id,
    v_user_id,
    p_token_hash,
    p_expires_at
  )
  returning si.id, si.email, si.expires_at
  into v_invite_id, v_invite_email, v_invite_expires_at;

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
    'invite',
    v_invite_id,
    'created',
    jsonb_build_object('role_key', p_role_key),
    '{}'::jsonb
  );

  invite_id := v_invite_id;
  email := v_invite_email;
  expires_at := v_invite_expires_at;

  return next;
end;
$$;

create or replace function public.record_invite_delivery_mvp(
  p_invite_id uuid,
  p_provider text,
  p_provider_message_id text,
  p_status text,
  p_error_code text default null,
  p_error_message text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_space_id uuid;
  v_delivery_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select space_id into v_space_id
  from public.space_invites
  where id = p_invite_id;

  if v_space_id is null then
    raise exception 'Invite not found';
  end if;

  if public.space_role(v_space_id) <> 'owner' then
    raise exception 'Only owners can record invite delivery';
  end if;

  insert into public.invite_deliveries (
    invite_id,
    channel,
    provider,
    provider_message_id,
    status,
    delivered_at,
    error_code,
    error_message,
    metadata
  )
  values (
    p_invite_id,
    'email',
    p_provider,
    p_provider_message_id,
    p_status,
    case when p_status in ('sent', 'delivered') then now() else null end,
    p_error_code,
    p_error_message,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_delivery_id;

  return v_delivery_id;
end;
$$;

create or replace function public.accept_invite_mvp(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_invite public.space_invites%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if trim(coalesce(v_email, '')) = '' then
    raise exception 'Signed-in account must have an email';
  end if;

  select *
  into v_invite
  from public.space_invites
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  for update;

  if not found then
    raise exception 'Invite not found';
  end if;

  if v_invite.status <> 'pending' then
    raise exception 'Invite is no longer active';
  end if;

  if v_invite.expires_at < now() then
    raise exception 'Invite has expired';
  end if;

  if lower(v_invite.email) <> v_email then
    raise exception 'Signed-in email does not match the invite';
  end if;

  insert into public.space_memberships (space_id, user_id, role_id, status, joined_at)
  values (v_invite.space_id, v_user_id, v_invite.role_id, 'active', now())
  on conflict (space_id, user_id) do update
  set
    role_id = excluded.role_id,
    status = 'active',
    updated_at = now();

  update public.space_invites
  set
    status = 'accepted',
    accepted_by = v_user_id,
    accepted_at = now()
  where id = v_invite.id;

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
    v_invite.space_id,
    v_user_id,
    'invite',
    v_invite.id,
    'accepted',
    jsonb_build_object('accepted_by', v_user_id),
    '{}'::jsonb
  );

  return v_invite.space_id;
end;
$$;

create or replace function public.create_event_mvp(
  p_space_id uuid,
  p_subject_id uuid default null,
  p_event_type_id uuid default null,
  p_occurred_at timestamptz default now(),
  p_summary text default null,
  p_details jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role text;
  v_event_id uuid;
  v_subject_id uuid := p_subject_id;
  v_event_type public.event_types%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_role := public.space_role(p_space_id);
  if v_role not in ('owner', 'caregiver') then
    raise exception 'Only caregivers and owners can log events';
  end if;

  select *
  into v_event_type
  from public.event_types
  where id = p_event_type_id
    and space_id = p_space_id
    and is_active = true;

  if not found then
    raise exception 'Event type was not found for this space';
  end if;

  if v_subject_id is null then
    select id
    into v_subject_id
    from public.subjects
    where space_id = p_space_id
      and status = 'active'
      and is_primary = true
    order by created_at asc
    limit 1;
  elsif not exists (
    select 1
    from public.subjects
    where id = v_subject_id
      and space_id = p_space_id
      and status = 'active'
  ) then
    raise exception 'Subject was not found for this space';
  end if;

  insert into public.events (
    space_id,
    subject_id,
    event_type_id,
    actor_user_id,
    occurred_at,
    summary,
    details
  )
  values (
    p_space_id,
    v_subject_id,
    p_event_type_id,
    v_user_id,
    p_occurred_at,
    nullif(trim(coalesce(p_summary, '')), ''),
    coalesce(p_details, '{}'::jsonb)
  )
  returning id into v_event_id;

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
    'event',
    v_event_id,
    'created',
    jsonb_build_object(
      'summary', nullif(trim(coalesce(p_summary, '')), ''),
      'details', coalesce(p_details, '{}'::jsonb)
    ),
    jsonb_build_object('event_type_id', p_event_type_id)
  );

  if v_event_type.default_notify then
    with recipients as (
      select sm.user_id
      from public.space_memberships sm
      left join public.notification_preferences np
        on np.user_id = sm.user_id
       and np.space_id = p_space_id
       and np.channel = 'in_app'
      where sm.space_id = p_space_id
        and sm.status = 'active'
        and sm.user_id <> v_user_id
        and coalesce(np.enabled, true) = true
        and coalesce(np.event_created_enabled, true) = true
    ),
    inserted_notifications as (
      insert into public.notifications (
        space_id,
        recipient_user_id,
        type,
        event_id,
        title,
        body,
        status
      )
      select
        p_space_id,
        recipients.user_id,
        'event_created',
        v_event_id,
        v_event_type.name || ' logged',
        coalesce(nullif(trim(coalesce(p_summary, '')), ''), 'A new shared caregiving event was logged.'),
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
      jsonb_build_object('source', 'create_event_mvp')
    from inserted_notifications;
  end if;

  return v_event_id;
end;
$$;

create or replace function public.create_reminder_mvp(
  p_space_id uuid,
  p_subject_id uuid default null,
  p_event_type_id uuid default null,
  p_title text default null,
  p_notes text default null,
  p_due_at timestamptz default null,
  p_assigned_to uuid default null,
  p_payload jsonb default '{}'::jsonb
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
      'assigned_to', p_assigned_to
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
      status = 'sent',
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
        jsonb_build_object('source', 'process_due_reminders_mvp')
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
        jsonb_build_object('source', 'process_due_reminders_mvp')
      from inserted_notifications;
    end if;

    v_processed := v_processed + 1;
  end loop;

  return v_processed;
end;
$$;

create or replace function public.mark_notification_read_mvp(p_notification_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  update public.notifications
  set
    status = 'read',
    read_at = coalesce(read_at, now()),
    updated_at = now()
  where id = p_notification_id
    and recipient_user_id = v_user_id;

  return found;
end;
$$;

revoke all on function public.create_space_mvp(text, text) from public;
grant execute on function public.create_space_mvp(text, text) to authenticated;

revoke all on function public.create_invite_mvp(uuid, text, text, text, timestamptz) from public;
grant execute on function public.create_invite_mvp(uuid, text, text, text, timestamptz) to authenticated;

revoke all on function public.record_invite_delivery_mvp(uuid, text, text, text, text, text, jsonb) from public;
grant execute on function public.record_invite_delivery_mvp(uuid, text, text, text, text, text, jsonb) to authenticated;

revoke all on function public.accept_invite_mvp(text) from public;
grant execute on function public.accept_invite_mvp(text) to authenticated;

revoke all on function public.create_event_mvp(uuid, uuid, uuid, timestamptz, text, jsonb) from public;
grant execute on function public.create_event_mvp(uuid, uuid, uuid, timestamptz, text, jsonb) to authenticated;

revoke all on function public.create_reminder_mvp(uuid, uuid, uuid, text, text, timestamptz, uuid, jsonb) from public;
grant execute on function public.create_reminder_mvp(uuid, uuid, uuid, text, text, timestamptz, uuid, jsonb) to authenticated;

revoke all on function public.process_due_reminders_mvp(integer) from public;
grant execute on function public.process_due_reminders_mvp(integer) to service_role;

revoke all on function public.mark_notification_read_mvp(uuid) from public;
grant execute on function public.mark_notification_read_mvp(uuid) to authenticated;
