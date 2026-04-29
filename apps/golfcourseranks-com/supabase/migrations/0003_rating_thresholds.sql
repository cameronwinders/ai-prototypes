create or replace function app_golfcourseranks_com_.refresh_course_ratings(
  min_golfers integer default 2,
  min_signals integer default 2
)
returns void
language plpgsql
security definer
set search_path = app_golfcourseranks_com_, public
as $$
begin
  insert into app_golfcourseranks_com_.course_ratings (
    course_id,
    score,
    normalized_score,
    rank,
    wins,
    losses,
    num_signals,
    num_unique_golfers,
    is_eligible,
    last_refreshed_at
  )
  with base as (
    select
      c.id as course_id,
      count(ps.id) filter (where ps.winner_course_id = c.id) as wins,
      count(ps.id) filter (where ps.loser_course_id = c.id) as losses,
      count(ps.id) filter (where ps.winner_course_id = c.id or ps.loser_course_id = c.id) as num_signals,
      count(distinct ps.user_id) filter (where ps.winner_course_id = c.id or ps.loser_course_id = c.id) as num_unique_golfers
    from app_golfcourseranks_com_.courses c
    left join app_golfcourseranks_com_.pairwise_signals ps
      on ps.winner_course_id = c.id or ps.loser_course_id = c.id
    group by c.id
  ),
  scored as (
    select
      course_id,
      wins,
      losses,
      num_signals,
      num_unique_golfers,
      (1500 + ((wins - losses) * 18) + (greatest(num_unique_golfers - 1, 0) * 4))::numeric(10, 2) as score,
      (num_unique_golfers >= min_golfers and num_signals >= min_signals) as is_eligible
    from base
  ),
  bounds as (
    select
      min(score) filter (where is_eligible) as min_score,
      max(score) filter (where is_eligible) as max_score
    from scored
  ),
  ranked as (
    select
      scored.*,
      case
        when scored.is_eligible then dense_rank() over (
          order by scored.score desc, scored.num_signals desc, scored.course_id
        )
        else null
      end as computed_rank,
      case
        when not scored.is_eligible then 0
        when bounds.max_score is null then 0
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
    wins,
    losses,
    num_signals,
    num_unique_golfers,
    is_eligible,
    timezone('utc', now())
  from ranked
  on conflict (course_id) do update
  set
    score = excluded.score,
    normalized_score = excluded.normalized_score,
    rank = excluded.rank,
    wins = excluded.wins,
    losses = excluded.losses,
    num_signals = excluded.num_signals,
    num_unique_golfers = excluded.num_unique_golfers,
    is_eligible = excluded.is_eligible,
    last_refreshed_at = excluded.last_refreshed_at;
end;
$$;
