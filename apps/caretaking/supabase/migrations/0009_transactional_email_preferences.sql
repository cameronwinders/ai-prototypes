alter table public.notification_preferences
  add column if not exists action_log_email_level text not null default 'important_only',
  add column if not exists reminder_completion_email_enabled boolean not null default true;

alter table public.notification_preferences
  drop constraint if exists notification_preferences_action_log_email_level_check;

alter table public.notification_preferences
  add constraint notification_preferences_action_log_email_level_check
  check (action_log_email_level in ('all', 'important_only', 'off'));

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in ('event_created', 'reminder_due', 'reminder_completed', 'invite_received', 'system'));

create unique index if not exists notification_deliveries_one_email_per_notification_idx
  on public.notification_deliveries (notification_id)
  where channel = 'email';

create unique index if not exists notifications_one_reminder_completed_per_recipient_idx
  on public.notifications (reminder_id, recipient_user_id)
  where reminder_id is not null and type = 'reminder_completed';

create unique index if not exists notifications_one_event_created_per_recipient_idx
  on public.notifications (event_id, recipient_user_id)
  where event_id is not null and type = 'event_created';
