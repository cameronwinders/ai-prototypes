alter table public.invite_deliveries enable row level security;

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
