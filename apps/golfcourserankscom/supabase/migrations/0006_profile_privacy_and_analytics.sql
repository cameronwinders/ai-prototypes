alter table if exists app_golfcourserankscom_.users
  add column if not exists home_state text,
  add column if not exists profile_visibility text not null default 'public',
  add column if not exists handicap_visibility boolean not null default true,
  add column if not exists discoverability_enabled boolean not null default true,
  add column if not exists free_handle_change_used_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'app_golfcourserankscom_users_profile_visibility_check'
  ) then
    alter table app_golfcourserankscom_.users
      add constraint app_golfcourserankscom_users_profile_visibility_check
      check (profile_visibility in ('public', 'friends_only', 'private'));
  end if;
end
$$;

create table if not exists app_golfcourserankscom_.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_golfcourserankscom_.users(id) on delete set null,
  event_name text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists app_golfcourserankscom_analytics_events_event_name_idx
  on app_golfcourserankscom_.analytics_events(event_name);

create index if not exists app_golfcourserankscom_analytics_events_user_id_idx
  on app_golfcourserankscom_.analytics_events(user_id);

create index if not exists app_golfcourserankscom_users_handle_idx
  on app_golfcourserankscom_.users(handle);

create index if not exists app_golfcourserankscom_users_discoverability_idx
  on app_golfcourserankscom_.users(discoverability_enabled, profile_visibility);
