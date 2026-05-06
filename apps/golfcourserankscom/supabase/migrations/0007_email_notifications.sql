create table app_golfcourserankscom_.email_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references app_golfcourserankscom_.users (id) on delete cascade,
  actor_user_id uuid references app_golfcourserankscom_.users (id) on delete set null,
  notification_type text not null,
  dedupe_key text not null unique,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint email_notifications_type_check check (
    notification_type in (
      'friend-request-received',
      'friend-request-accepted',
      'invite-conversion',
      'unranked-reminder'
    )
  )
);

create index email_notifications_recipient_type_idx
  on app_golfcourserankscom_.email_notifications (recipient_user_id, notification_type, created_at desc);

grant all on table app_golfcourserankscom_.email_notifications to service_role;
