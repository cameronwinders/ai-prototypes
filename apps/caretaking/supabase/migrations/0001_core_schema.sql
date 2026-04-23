create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_display_name_idx on public.profiles (display_name);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, timezone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'Caregiver'),
    new.raw_user_meta_data ->> 'avatar_url',
    coalesce(new.raw_user_meta_data ->> 'timezone', 'UTC')
  )
  on conflict (id) do update
  set
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    timezone = excluded.timezone,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create table if not exists public.spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists spaces_created_by_idx on public.spaces (created_by);
create index if not exists spaces_active_idx on public.spaces (archived_at) where archived_at is null;

create trigger set_spaces_updated_at
before update on public.spaces
for each row
execute function public.set_updated_at();

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  is_system boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.space_memberships (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_id uuid not null references public.roles (id),
  status text not null default 'active' check (status in ('active', 'inactive')),
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (space_id, user_id)
);

create index if not exists space_memberships_user_idx on public.space_memberships (user_id);
create index if not exists space_memberships_space_idx on public.space_memberships (space_id, status);

create trigger set_space_memberships_updated_at
before update on public.space_memberships
for each row
execute function public.set_updated_at();

create table if not exists public.space_invites (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  email text not null,
  role_id uuid not null references public.roles (id),
  invited_by uuid not null references public.profiles (id),
  token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null,
  accepted_by uuid references public.profiles (id),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists space_invites_space_idx on public.space_invites (space_id, status);
create index if not exists space_invites_email_idx on public.space_invites ((lower(email)));
create index if not exists space_invites_pending_email_idx on public.space_invites (space_id, (lower(email))) where status = 'pending';

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  name text not null,
  kind text,
  is_primary boolean not null default false,
  status text not null default 'active' check (status in ('active', 'inactive')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subjects_space_idx on public.subjects (space_id, status);
create index if not exists subjects_primary_idx on public.subjects (space_id, is_primary);
create unique index if not exists subjects_one_primary_per_space_idx
  on public.subjects (space_id)
  where is_primary = true and status = 'active';

create trigger set_subjects_updated_at
before update on public.subjects
for each row
execute function public.set_updated_at();

create table if not exists public.event_types (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  key text not null,
  name text not null,
  description text,
  icon text,
  color text,
  is_active boolean not null default true,
  schema jsonb not null default '{}'::jsonb,
  default_notify boolean not null default true,
  default_reminder_template jsonb,
  sort_order integer not null default 0,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (space_id, key)
);

create index if not exists event_types_space_idx on public.event_types (space_id, is_active, sort_order);

create trigger set_event_types_updated_at
before update on public.event_types
for each row
execute function public.set_updated_at();

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  event_type_id uuid not null references public.event_types (id),
  actor_user_id uuid not null references public.profiles (id),
  occurred_at timestamptz not null,
  logged_at timestamptz not null default now(),
  summary text,
  details jsonb not null default '{}'::jsonb,
  source text not null default 'manual' check (source in ('manual', 'reminder', 'system', 'import')),
  status text not null default 'active' check (status in ('active', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_space_occurred_idx on public.events (space_id, occurred_at desc, id desc);
create index if not exists events_subject_occurred_idx on public.events (subject_id, occurred_at desc, id desc);
create index if not exists events_type_idx on public.events (event_type_id, occurred_at desc);
create index if not exists events_actor_idx on public.events (actor_user_id, occurred_at desc);
create index if not exists events_active_idx on public.events (space_id, status, occurred_at desc);

create trigger set_events_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  event_type_id uuid references public.event_types (id) on delete set null,
  created_by uuid not null references public.profiles (id),
  assigned_to uuid references public.profiles (id),
  title text not null,
  notes text,
  due_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'sent', 'completed', 'canceled', 'expired')),
  schedule_kind text not null default 'one_time' check (schedule_kind in ('one_time')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  completed_event_id uuid references public.events (id)
);

create index if not exists reminders_space_due_idx on public.reminders (space_id, status, due_at);
create index if not exists reminders_assigned_due_idx on public.reminders (assigned_to, status, due_at);

create trigger set_reminders_updated_at
before update on public.reminders
for each row
execute function public.set_updated_at();

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  recipient_user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('event_created', 'reminder_due', 'invite_received', 'system')),
  event_id uuid references public.events (id) on delete cascade,
  reminder_id uuid references public.reminders (id) on delete cascade,
  invite_id uuid references public.space_invites (id) on delete cascade,
  title text not null,
  body text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'read')),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notifications_recipient_idx on public.notifications (recipient_user_id, status, created_at desc);
create index if not exists notifications_space_idx on public.notifications (space_id, created_at desc);
create index if not exists notifications_event_idx on public.notifications (event_id);
create index if not exists notifications_reminder_idx on public.notifications (reminder_id);

create trigger set_notifications_updated_at
before update on public.notifications
for each row
execute function public.set_updated_at();

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications (id) on delete cascade,
  channel text not null check (channel in ('in_app', 'push', 'email')),
  provider text,
  provider_message_id text,
  status text not null check (status in ('queued', 'sent', 'delivered', 'failed')),
  attempted_at timestamptz not null default now(),
  delivered_at timestamptz,
  error_code text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists notification_deliveries_notification_idx on public.notification_deliveries (notification_id, channel, attempted_at desc);
create index if not exists notification_deliveries_status_idx on public.notification_deliveries (status, attempted_at desc);

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  space_id uuid references public.spaces (id) on delete cascade,
  channel text not null check (channel in ('in_app', 'push', 'email')),
  enabled boolean not null default true,
  event_created_enabled boolean not null default true,
  reminder_due_enabled boolean not null default true,
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, space_id, channel)
);

create index if not exists notification_preferences_user_idx on public.notification_preferences (user_id);

create trigger set_notification_preferences_updated_at
before update on public.notification_preferences
for each row
execute function public.set_updated_at();

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references public.spaces (id) on delete cascade,
  actor_user_id uuid references public.profiles (id),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  changes jsonb not null default '{}'::jsonb,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_space_idx on public.audit_logs (space_id, created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id, created_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_user_id, created_at desc);

create or replace function public.is_space_member(target_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.space_memberships sm
    where sm.space_id = target_space_id
      and sm.user_id = auth.uid()
      and sm.status = 'active'
  );
$$;

create or replace function public.space_role(target_space_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.key
  from public.space_memberships sm
  join public.roles r on r.id = sm.role_id
  where sm.space_id = target_space_id
    and sm.user_id = auth.uid()
    and sm.status = 'active'
  limit 1;
$$;

create or replace function public.is_space_admin(target_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.space_role(target_space_id) = 'owner';
$$;
