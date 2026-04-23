alter table public.profiles enable row level security;
alter table public.spaces enable row level security;
alter table public.roles enable row level security;
alter table public.space_memberships enable row level security;
alter table public.space_invites enable row level security;
alter table public.subjects enable row level security;
alter table public.event_types enable row level security;
alter table public.events enable row level security;
alter table public.reminders enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.audit_logs enable row level security;
alter table public.invite_deliveries enable row level security;

drop policy if exists "profiles_select_shared_or_self" on public.profiles;
create policy "profiles_select_shared_or_self"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.space_memberships mine
    join public.space_memberships theirs
      on theirs.space_id = mine.space_id
    where mine.user_id = auth.uid()
      and mine.status = 'active'
      and theirs.user_id = profiles.id
      and theirs.status = 'active'
  )
);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "spaces_select_member" on public.spaces;
create policy "spaces_select_member"
on public.spaces for select
to authenticated
using (public.is_space_member(id));

drop policy if exists "roles_select_authenticated" on public.roles;
create policy "roles_select_authenticated"
on public.roles for select
to authenticated
using (true);

drop policy if exists "space_memberships_select_member" on public.space_memberships;
create policy "space_memberships_select_member"
on public.space_memberships for select
to authenticated
using (public.is_space_member(space_id));

drop policy if exists "space_invites_select_owner" on public.space_invites;
create policy "space_invites_select_owner"
on public.space_invites for select
to authenticated
using (public.is_space_admin(space_id));

drop policy if exists "subjects_select_member" on public.subjects;
create policy "subjects_select_member"
on public.subjects for select
to authenticated
using (public.is_space_member(space_id));

drop policy if exists "event_types_select_member" on public.event_types;
create policy "event_types_select_member"
on public.event_types for select
to authenticated
using (public.is_space_member(space_id));

drop policy if exists "events_select_member" on public.events;
create policy "events_select_member"
on public.events for select
to authenticated
using (public.is_space_member(space_id));

drop policy if exists "reminders_select_member" on public.reminders;
create policy "reminders_select_member"
on public.reminders for select
to authenticated
using (public.is_space_member(space_id));

drop policy if exists "notifications_select_recipient" on public.notifications;
create policy "notifications_select_recipient"
on public.notifications for select
to authenticated
using (recipient_user_id = auth.uid());

drop policy if exists "notification_deliveries_select_recipient" on public.notification_deliveries;
create policy "notification_deliveries_select_recipient"
on public.notification_deliveries for select
to authenticated
using (
  exists (
    select 1
    from public.notifications n
    where n.id = notification_deliveries.notification_id
      and n.recipient_user_id = auth.uid()
  )
);

drop policy if exists "notification_preferences_select_self" on public.notification_preferences;
create policy "notification_preferences_select_self"
on public.notification_preferences for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "notification_preferences_insert_self" on public.notification_preferences;
create policy "notification_preferences_insert_self"
on public.notification_preferences for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "notification_preferences_update_self" on public.notification_preferences;
create policy "notification_preferences_update_self"
on public.notification_preferences for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "notification_preferences_delete_self" on public.notification_preferences;
create policy "notification_preferences_delete_self"
on public.notification_preferences for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "audit_logs_select_member" on public.audit_logs;
create policy "audit_logs_select_member"
on public.audit_logs for select
to authenticated
using (space_id is not null and public.is_space_member(space_id));

drop policy if exists "invite_deliveries_select_owner" on public.invite_deliveries;
create policy "invite_deliveries_select_owner"
on public.invite_deliveries for select
to authenticated
using (
  exists (
    select 1
    from public.space_invites si
    where si.id = invite_deliveries.invite_id
      and public.is_space_admin(si.space_id)
  )
);

drop policy if exists "spaces_insert_creator" on public.spaces;
drop policy if exists "spaces_update_owner" on public.spaces;
drop policy if exists "space_memberships_insert_creator_or_owner" on public.space_memberships;
drop policy if exists "space_memberships_update_owner" on public.space_memberships;
drop policy if exists "space_invites_select_invitee" on public.space_invites;
drop policy if exists "space_invites_insert_owner" on public.space_invites;
drop policy if exists "space_invites_update_owner" on public.space_invites;
drop policy if exists "space_invites_update_invitee" on public.space_invites;
drop policy if exists "subjects_insert_member" on public.subjects;
drop policy if exists "subjects_update_member" on public.subjects;
drop policy if exists "event_types_insert_owner" on public.event_types;
drop policy if exists "event_types_update_owner" on public.event_types;
drop policy if exists "events_insert_member" on public.events;
drop policy if exists "events_update_owner_or_actor" on public.events;
drop policy if exists "reminders_insert_member" on public.reminders;
drop policy if exists "reminders_update_creator_assignee_owner" on public.reminders;
drop policy if exists "notifications_insert_member" on public.notifications;
drop policy if exists "notifications_update_recipient" on public.notifications;
drop policy if exists "audit_logs_insert_member" on public.audit_logs;

create unique index if not exists notifications_one_reminder_due_per_recipient_idx
  on public.notifications (reminder_id, recipient_user_id)
  where reminder_id is not null and type = 'reminder_due';
