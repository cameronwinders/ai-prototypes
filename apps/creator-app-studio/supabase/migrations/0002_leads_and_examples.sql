create table if not exists app_creator_app_studio.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  email text not null,
  brand_name text,
  creator_handle text,
  primary_platform text,
  audience_size_range text,
  niche text,
  current_monetization text,
  rough_app_idea text,
  cta_source text,
  status text default 'new'
);

create table if not exists app_creator_app_studio.example_concepts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  vertical text not null,
  title text not null,
  description text not null,
  example_features text[],
  monetization_angle text,
  display_order int
);

create index if not exists creator_app_studio_leads_created_at_idx
  on app_creator_app_studio.leads (created_at desc);

create index if not exists creator_app_studio_leads_status_idx
  on app_creator_app_studio.leads (status);

create index if not exists creator_app_studio_example_concepts_display_order_idx
  on app_creator_app_studio.example_concepts (display_order);

alter table app_creator_app_studio.leads enable row level security;
alter table app_creator_app_studio.example_concepts enable row level security;

drop policy if exists "Public can submit creator app studio leads"
  on app_creator_app_studio.leads;

create policy "Public can submit creator app studio leads"
  on app_creator_app_studio.leads
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Public can read creator app studio concepts"
  on app_creator_app_studio.example_concepts;

create policy "Public can read creator app studio concepts"
  on app_creator_app_studio.example_concepts
  for select
  to anon, authenticated
  using (true);
