create table app_golfcourserankscom_.wishlist_courses (
  user_id uuid not null references app_golfcourserankscom_.users (id) on delete cascade,
  course_id uuid not null references app_golfcourserankscom_.courses (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, course_id)
);

create trigger wishlist_courses_set_updated_at
before update on app_golfcourserankscom_.wishlist_courses
for each row execute function app_golfcourserankscom_.set_updated_at();

alter table app_golfcourserankscom_.wishlist_courses enable row level security;

create policy "Wishlist courses belong to owner"
on app_golfcourserankscom_.wishlist_courses
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
