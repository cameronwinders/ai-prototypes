insert into public.roles (key, name, description)
values
  ('owner', 'Owner', 'Full control of a shared caregiving space'),
  ('caregiver', 'Caregiver', 'Can log events and manage shared day-to-day activity'),
  ('viewer', 'Viewer', 'Read-only access to the shared space')
on conflict (key) do update
set
  name = excluded.name,
  description = excluded.description;
