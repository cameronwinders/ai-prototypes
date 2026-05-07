create or replace function app_golfcourserankscom_.normalize_course_identity(course_name text)
returns text
language sql
immutable
as $$
  select trim(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(lower(coalesce(course_name, '')), '&', ' and ', 'g'),
          '^the\s+',
          '',
          'g'
        ),
        '\b(golf\s+and\s+beach\s+club|golf\s+club|golf\s+course|country\s+club)\b$',
        '',
        'g'
      ),
      '\bcourse\b$|[^a-z0-9]+',
      ' ',
      'g'
    )
  );
$$;

do $$
declare
  duplicate_count integer;
begin
  create temporary table duplicate_course_map (
    duplicate_course_id uuid primary key,
    canonical_course_id uuid not null
  ) on commit drop;

  insert into duplicate_course_map (duplicate_course_id, canonical_course_id)
  with normalized_courses as (
    select
      c.id,
      c.seed_rank,
      c.created_at,
      c.city,
      c.state,
      app_golfcourserankscom_.normalize_course_identity(c.name) as normalized_name,
      first_value(c.id) over (
        partition by lower(c.city), lower(c.state), app_golfcourserankscom_.normalize_course_identity(c.name)
        order by c.seed_rank asc nulls last, c.created_at asc, c.id asc
      ) as canonical_course_id
    from app_golfcourserankscom_.courses c
  )
  select
    id as duplicate_course_id,
    canonical_course_id
  from normalized_courses
  where id <> canonical_course_id;

  get diagnostics duplicate_count = row_count;

  if duplicate_count = 0 then
    return;
  end if;

  create temporary table affected_users (
    user_id uuid primary key
  ) on commit drop;

  insert into affected_users (user_id)
  select distinct ucr.user_id
  from app_golfcourserankscom_.user_course_ranks ucr
  join duplicate_course_map dcm
    on dcm.duplicate_course_id = ucr.course_id;

  insert into app_golfcourserankscom_.played_courses (
    user_id,
    course_id,
    note,
    played_at,
    created_at,
    updated_at
  )
  select
    pc.user_id,
    dcm.canonical_course_id,
    pc.note,
    pc.played_at,
    pc.created_at,
    pc.updated_at
  from app_golfcourserankscom_.played_courses pc
  join duplicate_course_map dcm
    on dcm.duplicate_course_id = pc.course_id
  on conflict (user_id, course_id) do update
  set
    note = coalesce(app_golfcourserankscom_.played_courses.note, excluded.note),
    played_at = least(app_golfcourserankscom_.played_courses.played_at, excluded.played_at),
    created_at = least(app_golfcourserankscom_.played_courses.created_at, excluded.created_at),
    updated_at = greatest(app_golfcourserankscom_.played_courses.updated_at, excluded.updated_at);

  delete from app_golfcourserankscom_.played_courses pc
  using duplicate_course_map dcm
  where pc.course_id = dcm.duplicate_course_id;

  delete from app_golfcourserankscom_.user_course_ranks ucr
  using duplicate_course_map dcm
  where ucr.course_id = dcm.duplicate_course_id
    and exists (
      select 1
      from app_golfcourserankscom_.user_course_ranks canonical_rank
      where canonical_rank.user_id = ucr.user_id
        and canonical_rank.course_id = dcm.canonical_course_id
    );

  update app_golfcourserankscom_.user_course_ranks ucr
  set course_id = dcm.canonical_course_id
  from duplicate_course_map dcm
  where ucr.course_id = dcm.duplicate_course_id;

  insert into app_golfcourserankscom_.wishlist_courses (
    user_id,
    course_id,
    created_at,
    updated_at
  )
  select
    wc.user_id,
    dcm.canonical_course_id,
    wc.created_at,
    wc.updated_at
  from app_golfcourserankscom_.wishlist_courses wc
  join duplicate_course_map dcm
    on dcm.duplicate_course_id = wc.course_id
  on conflict (user_id, course_id) do update
  set updated_at = greatest(app_golfcourserankscom_.wishlist_courses.updated_at, excluded.updated_at);

  delete from app_golfcourserankscom_.wishlist_courses wc
  using duplicate_course_map dcm
  where wc.course_id = dcm.duplicate_course_id;

  delete from app_golfcourserankscom_.pairwise_signals ps
  using affected_users au
  where ps.user_id = au.user_id;

  insert into app_golfcourserankscom_.pairwise_signals (
    user_id,
    winner_course_id,
    loser_course_id
  )
  select
    higher.user_id,
    higher.course_id,
    lower.course_id
  from app_golfcourserankscom_.user_course_ranks higher
  join app_golfcourserankscom_.user_course_ranks lower
    on lower.user_id = higher.user_id
   and lower.rank_position > higher.rank_position
  join affected_users au
    on au.user_id = higher.user_id;

  delete from app_golfcourserankscom_.courses c
  using duplicate_course_map dcm
  where c.id = dcm.duplicate_course_id;

  perform app_golfcourserankscom_.refresh_course_aggregates();
end;
$$;
