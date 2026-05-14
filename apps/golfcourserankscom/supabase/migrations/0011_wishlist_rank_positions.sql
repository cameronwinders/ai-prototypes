alter table app_golfcourserankscom_.wishlist_courses
add column if not exists rank_position integer;

with ordered as (
  select
    user_id,
    course_id,
    row_number() over (
      partition by user_id
      order by created_at asc, course_id asc
    ) - 1 as next_rank_position
  from app_golfcourserankscom_.wishlist_courses
)
update app_golfcourserankscom_.wishlist_courses wishlist
set rank_position = ordered.next_rank_position
from ordered
where wishlist.user_id = ordered.user_id
  and wishlist.course_id = ordered.course_id
  and (wishlist.rank_position is null or wishlist.rank_position <> ordered.next_rank_position);

alter table app_golfcourserankscom_.wishlist_courses
alter column rank_position set not null;

alter table app_golfcourserankscom_.wishlist_courses
alter column rank_position set default 0;
