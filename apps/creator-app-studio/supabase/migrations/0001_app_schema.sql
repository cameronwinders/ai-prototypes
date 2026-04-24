create schema if not exists app_creator_app_studio;

grant usage on schema app_creator_app_studio to anon, authenticated, service_role;
grant all privileges on all tables in schema app_creator_app_studio to service_role;
grant all privileges on all routines in schema app_creator_app_studio to service_role;
grant usage, select on all sequences in schema app_creator_app_studio to authenticated, service_role;

do $$
declare
  current_setting_value text;
  desired_value text;
begin
  desired_value := 'app_creator_app_studio';

  begin
    select setting
      into current_setting_value
      from pg_settings
     where name = 'pgrst.db_schemas';
  exception
    when undefined_table then
      current_setting_value := null;
  end;

  if current_setting_value is null or current_setting_value = '' then
    execute format(
      'alter role authenticator set pgrst.db_schemas = %L',
      'public,storage,graphql_public,' || desired_value
    );
  elsif position(desired_value in current_setting_value) = 0 then
    execute format(
      'alter role authenticator set pgrst.db_schemas = %L',
      current_setting_value || ',' || desired_value
    );
  end if;
end
$$;

notify pgrst, 'reload config';

-- Add app-specific tables, functions, and policies in this schema.
