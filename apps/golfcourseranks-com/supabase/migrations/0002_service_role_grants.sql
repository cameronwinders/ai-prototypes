grant all privileges on all tables in schema app_golfcourseranks_com_ to service_role;
grant all privileges on all routines in schema app_golfcourseranks_com_ to service_role;
grant all privileges on all sequences in schema app_golfcourseranks_com_ to service_role;

alter default privileges in schema app_golfcourseranks_com_
grant all privileges on tables to service_role;

alter default privileges in schema app_golfcourseranks_com_
grant all privileges on routines to service_role;

alter default privileges in schema app_golfcourseranks_com_
grant all privileges on sequences to service_role;
