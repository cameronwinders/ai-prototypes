grant usage on schema app_caretaking to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema app_caretaking to authenticated;
grant all privileges on all tables in schema app_caretaking to service_role;
grant usage, select on all sequences in schema app_caretaking to authenticated, service_role;

grant execute on all routines in schema app_caretaking to authenticated, service_role;

alter default privileges in schema app_caretaking
grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema app_caretaking
grant all privileges on tables to service_role;

alter default privileges in schema app_caretaking
grant usage, select on sequences to authenticated, service_role;

alter default privileges in schema app_caretaking
grant execute on routines to authenticated, service_role;
