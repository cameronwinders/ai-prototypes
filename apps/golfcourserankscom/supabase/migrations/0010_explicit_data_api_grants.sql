-- Supabase will require explicit Data API grants for exposed tables.
-- The core schema migration already granted the original app tables, but
-- wishlist_courses was added later with RLS only. Make the grant explicit so
-- authenticated golfers keep API access when Supabase enforces the change.

grant select, insert, update, delete
on table app_golfcourserankscom_.wishlist_courses
to authenticated;

grant all
on table app_golfcourserankscom_.wishlist_courses
to service_role;
