create or replace function app_golfcourserankscom_.refresh_course_aggregates()
returns void
language plpgsql
security definer
set search_path = app_golfcourserankscom_, public
as $$
begin
  insert into app_golfcourserankscom_.course_aggregates (
    course_id,
    score,
    normalized_score,
    rank,
    crowd_score,
    wins,
    losses,
    num_signals,
    num_unique_golfers,
    is_early,
    last_refreshed_at
  )
  with base as (
    select
      c.id as course_id,
      c.seed_score,
      count(ps.id) filter (where ps.winner_course_id = c.id) as wins,
      count(ps.id) filter (where ps.loser_course_id = c.id) as losses,
      count(ps.id) filter (where ps.winner_course_id = c.id or ps.loser_course_id = c.id) as num_signals,
      count(distinct ps.user_id) filter (where ps.winner_course_id = c.id or ps.loser_course_id = c.id) as num_unique_golfers
    from app_golfcourserankscom_.courses c
    left join app_golfcourserankscom_.pairwise_signals ps
      on ps.winner_course_id = c.id or ps.loser_course_id = c.id
    group by c.id, c.seed_score
  ),
  scored as (
    select
      course_id,
      seed_score,
      wins,
      losses,
      num_signals,
      num_unique_golfers,
      round(
        (
          seed_score * (1 - least(num_unique_golfers / 10.0, 1))
        ) + (
          (seed_score + ((wins - losses) * 10) + (log(2, num_signals + 1) * 18) + (num_unique_golfers * 3))
          * least(num_unique_golfers / 10.0, 1)
        ),
        2
      ) as score,
      round(
        (((wins - losses) * 10) + (log(2, num_signals + 1) * 18) + (num_unique_golfers * 3)),
        2
      ) as crowd_score,
      (num_signals < 6 or num_unique_golfers < 3) as is_early
    from base
  ),
  bounds as (
    select min(score) as min_score, max(score) as max_score from scored
  ),
  ranked as (
    select
      scored.*,
      dense_rank() over (order by scored.score desc, scored.wins desc, scored.course_id) as computed_rank,
      case
        when bounds.max_score = bounds.min_score then 100
        else round((((scored.score - bounds.min_score) / nullif(bounds.max_score - bounds.min_score, 0)) * 100)::numeric, 1)
      end as computed_normalized
    from scored
    cross join bounds
  )
  select
    course_id,
    score,
    computed_normalized,
    computed_rank,
    crowd_score,
    wins,
    losses,
    num_signals,
    num_unique_golfers,
    is_early,
    timezone('utc', now())
  from ranked
  on conflict (course_id) do update
  set
    score = excluded.score,
    normalized_score = excluded.normalized_score,
    rank = excluded.rank,
    crowd_score = excluded.crowd_score,
    wins = excluded.wins,
    losses = excluded.losses,
    num_signals = excluded.num_signals,
    num_unique_golfers = excluded.num_unique_golfers,
    is_early = excluded.is_early,
    last_refreshed_at = excluded.last_refreshed_at;
end;
$$;
