create table if not exists app_creator_app_studio.admin_allowlist (
  email text primary key,
  created_at timestamptz not null default now()
);

insert into app_creator_app_studio.admin_allowlist (email)
values ('cameronwinders@gmail.com')
on conflict (email) do nothing;

create table if not exists app_creator_app_studio.accounts (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text not null,
  name text,
  brand_name text,
  creator_handle text,
  primary_platform text,
  audience_size_range text,
  niche text,
  current_monetization text,
  rough_app_idea text,
  role text not null default 'creator' check (role in ('creator', 'admin')),
  primary_demo_url text,
  demo_label text,
  demo_status text not null default 'not_assigned' check (demo_status in ('not_assigned', 'shared', 'reviewing', 'live')),
  admin_notes text
);

alter table app_creator_app_studio.leads
  add column if not exists account_id uuid references app_creator_app_studio.accounts (id) on delete set null;

create unique index if not exists creator_app_studio_accounts_email_idx
  on app_creator_app_studio.accounts (lower(email));

create index if not exists creator_app_studio_accounts_role_idx
  on app_creator_app_studio.accounts (role);

create index if not exists creator_app_studio_accounts_updated_at_idx
  on app_creator_app_studio.accounts (updated_at desc);

create index if not exists creator_app_studio_leads_account_id_idx
  on app_creator_app_studio.leads (account_id);

create or replace function app_creator_app_studio.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists creator_app_studio_accounts_set_updated_at
  on app_creator_app_studio.accounts;

create trigger creator_app_studio_accounts_set_updated_at
before update on app_creator_app_studio.accounts
for each row
execute function app_creator_app_studio.set_updated_at();

create or replace function app_creator_app_studio.is_admin(actor uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = app_creator_app_studio, public
stable
as $$
  select exists (
    select 1
    from app_creator_app_studio.accounts
    where id = actor
      and role = 'admin'
  );
$$;

grant select on app_creator_app_studio.admin_allowlist to service_role;
grant select on app_creator_app_studio.accounts to authenticated;
grant update (
  name,
  brand_name,
  creator_handle,
  primary_platform,
  audience_size_range,
  niche,
  current_monetization,
  rough_app_idea
) on app_creator_app_studio.accounts to authenticated;
grant insert on app_creator_app_studio.accounts to service_role;
grant update (
  email,
  name,
  brand_name,
  creator_handle,
  primary_platform,
  audience_size_range,
  niche,
  current_monetization,
  rough_app_idea,
  role,
  primary_demo_url,
  demo_label,
  demo_status,
  admin_notes,
  updated_at
) on app_creator_app_studio.accounts to service_role;

alter table app_creator_app_studio.accounts enable row level security;
alter table app_creator_app_studio.admin_allowlist enable row level security;

drop policy if exists "Creators can read own account" on app_creator_app_studio.accounts;
create policy "Creators can read own account"
  on app_creator_app_studio.accounts
  for select
  to authenticated
  using (auth.uid() = id or app_creator_app_studio.is_admin(auth.uid()));

drop policy if exists "Creators can update own profile" on app_creator_app_studio.accounts;
create policy "Creators can update own profile"
  on app_creator_app_studio.accounts
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Service role manages allowlist" on app_creator_app_studio.admin_allowlist;
create policy "Service role manages allowlist"
  on app_creator_app_studio.admin_allowlist
  for all
  to service_role
  using (true)
  with check (true);
