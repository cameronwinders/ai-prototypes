create table if not exists app_caretaking.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_caretaking.profiles (id) on delete cascade,
  space_id uuid references app_caretaking.spaces (id) on delete set null,
  type text not null check (type in ('bug', 'feature_request', 'general_feedback')),
  subject text not null check (char_length(trim(subject)) between 3 and 140),
  description text,
  route text not null,
  severity text check (severity in ('low', 'medium', 'high', 'critical')),
  contact_allowed boolean not null default true,
  status text not null default 'new' check (status in ('new', 'reviewing', 'planned', 'closed')),
  page_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint feedback_severity_matches_type check (
    (type = 'bug' and severity is not null)
    or (type <> 'bug' and severity is null)
  )
);

create index if not exists feedback_submissions_user_created_idx
  on app_caretaking.feedback_submissions (user_id, created_at desc);

create index if not exists feedback_submissions_status_created_idx
  on app_caretaking.feedback_submissions (status, created_at desc);

create index if not exists feedback_submissions_space_created_idx
  on app_caretaking.feedback_submissions (space_id, created_at desc);

drop trigger if exists set_feedback_submissions_updated_at on app_caretaking.feedback_submissions;
create trigger set_feedback_submissions_updated_at
before update on app_caretaking.feedback_submissions
for each row execute function public.set_updated_at();

alter table app_caretaking.feedback_submissions enable row level security;

drop policy if exists "feedback_submissions_select_own" on app_caretaking.feedback_submissions;
create policy "feedback_submissions_select_own"
on app_caretaking.feedback_submissions for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "feedback_submissions_insert_own" on app_caretaking.feedback_submissions;
create policy "feedback_submissions_insert_own"
on app_caretaking.feedback_submissions for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    space_id is null
    or exists (
      select 1
      from app_caretaking.space_memberships sm
      where sm.space_id = feedback_submissions.space_id
        and sm.user_id = auth.uid()
        and sm.status = 'active'
    )
  )
);

create or replace view public.feedback_submissions as
select * from app_caretaking.feedback_submissions;

grant select, insert on app_caretaking.feedback_submissions to authenticated;
grant all privileges on app_caretaking.feedback_submissions to service_role;
grant select, insert on public.feedback_submissions to authenticated;
grant all privileges on public.feedback_submissions to service_role;
