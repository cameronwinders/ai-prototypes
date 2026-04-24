create schema if not exists app_caretaking;

grant usage on schema app_caretaking to anon, authenticated, service_role;
grant all on all tables in schema app_caretaking to service_role;
grant all on all routines in schema app_caretaking to service_role;
grant select, insert, update, delete on all tables in schema app_caretaking to authenticated;
grant execute on all routines in schema app_caretaking to authenticated;

alter role authenticator set pgrst.db_schemas = 'public,storage,graphql_public,app_caretaking';
notify pgrst, 'reload config';

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'profiles',
    'spaces',
    'roles',
    'space_memberships',
    'space_invites',
    'invite_deliveries',
    'subjects',
    'event_types',
    'events',
    'reminders',
    'notifications',
    'notification_deliveries',
    'notification_preferences',
    'audit_logs'
  ]
  loop
    if exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = target_table
        and table_type = 'BASE TABLE'
    ) then
      execute format('alter table public.%I set schema app_caretaking', target_table);
    end if;
  end loop;
end
$$;

create or replace view public.profiles as
select * from app_caretaking.profiles;

create or replace view public.spaces as
select * from app_caretaking.spaces;

create or replace view public.roles as
select * from app_caretaking.roles;

create or replace view public.space_memberships as
select * from app_caretaking.space_memberships;

create or replace view public.space_invites as
select * from app_caretaking.space_invites;

create or replace view public.invite_deliveries as
select * from app_caretaking.invite_deliveries;

create or replace view public.subjects as
select * from app_caretaking.subjects;

create or replace view public.event_types as
select * from app_caretaking.event_types;

create or replace view public.events as
select * from app_caretaking.events;

create or replace view public.reminders as
select * from app_caretaking.reminders;

create or replace view public.notifications as
select * from app_caretaking.notifications;

create or replace view public.notification_deliveries as
select * from app_caretaking.notification_deliveries;

create or replace view public.notification_preferences as
select * from app_caretaking.notification_preferences;

create or replace view public.audit_logs as
select * from app_caretaking.audit_logs;

create or replace function app_caretaking.space_role(target_space_id uuid)
returns text
language sql
stable
set search_path = public, app_caretaking
as $$
  select public.space_role(target_space_id);
$$;

create or replace function app_caretaking.create_space_mvp(p_name text, p_subject_name text default null)
returns uuid
language sql
security definer
set search_path = public, app_caretaking
as $$
  select public.create_space_mvp(p_name, p_subject_name);
$$;

create or replace function app_caretaking.create_invite_mvp(
  p_space_id uuid,
  p_email text,
  p_role_key text,
  p_token_hash text,
  p_expires_at timestamptz
)
returns table (invite_id uuid, email text, expires_at timestamptz)
language sql
security definer
set search_path = public, app_caretaking
as $$
  select * from public.create_invite_mvp(p_space_id, p_email, p_role_key, p_token_hash, p_expires_at);
$$;

create or replace function app_caretaking.record_invite_delivery_mvp(
  p_invite_id uuid,
  p_provider text,
  p_provider_message_id text,
  p_status text,
  p_error_code text default null,
  p_error_message text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language sql
security definer
set search_path = public, app_caretaking
as $$
  select public.record_invite_delivery_mvp(
    p_invite_id,
    p_provider,
    p_provider_message_id,
    p_status,
    p_error_code,
    p_error_message,
    p_metadata
  );
$$;

create or replace function app_caretaking.accept_invite_mvp(p_token text)
returns uuid
language sql
security definer
set search_path = public, app_caretaking
as $$
  select public.accept_invite_mvp(p_token);
$$;

create or replace function app_caretaking.create_event_mvp(
  p_space_id uuid,
  p_subject_id uuid default null,
  p_event_type_id uuid default null,
  p_occurred_at timestamptz default now(),
  p_summary text default null,
  p_details jsonb default '{}'::jsonb
)
returns uuid
language sql
security definer
set search_path = public, app_caretaking
as $$
  select public.create_event_mvp(p_space_id, p_subject_id, p_event_type_id, p_occurred_at, p_summary, p_details);
$$;

create or replace function app_caretaking.create_reminder_mvp(
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
language sql
security definer
set search_path = public, app_caretaking
as $$
  select public.create_reminder_mvp(
    p_space_id,
    p_subject_id,
    p_event_type_id,
    p_title,
    p_notes,
    p_due_at,
    p_assigned_to,
    p_payload,
    p_schedule_kind
  );
$$;

create or replace function app_caretaking.complete_reminder_mvp(p_reminder_id uuid)
returns boolean
language sql
security definer
set search_path = public, app_caretaking
as $$
  select public.complete_reminder_mvp(p_reminder_id);
$$;

create or replace function app_caretaking.process_due_reminders_mvp(p_limit integer default 50)
returns integer
language sql
security definer
set search_path = public, app_caretaking
as $$
  select public.process_due_reminders_mvp(p_limit);
$$;

create or replace function app_caretaking.mark_notification_read_mvp(p_notification_id uuid)
returns boolean
language sql
security definer
set search_path = public, app_caretaking
as $$
  select public.mark_notification_read_mvp(p_notification_id);
$$;

grant execute on function app_caretaking.space_role(uuid) to authenticated;
grant execute on function app_caretaking.create_space_mvp(text, text) to authenticated;
grant execute on function app_caretaking.create_invite_mvp(uuid, text, text, text, timestamptz) to authenticated;
grant execute on function app_caretaking.record_invite_delivery_mvp(uuid, text, text, text, text, text, jsonb) to authenticated;
grant execute on function app_caretaking.accept_invite_mvp(text) to authenticated;
grant execute on function app_caretaking.create_event_mvp(uuid, uuid, uuid, timestamptz, text, jsonb) to authenticated;
grant execute on function app_caretaking.create_reminder_mvp(uuid, uuid, uuid, text, text, timestamptz, uuid, jsonb, text) to authenticated;
grant execute on function app_caretaking.complete_reminder_mvp(uuid) to authenticated;
grant execute on function app_caretaking.mark_notification_read_mvp(uuid) to authenticated;
grant execute on function app_caretaking.process_due_reminders_mvp(integer) to service_role;
