create schema if not exists app_golfcourseranks_com_;

grant usage on schema app_golfcourseranks_com_ to anon, authenticated, service_role;

create extension if not exists pgcrypto;

create type app_golfcourseranks_com_.handicap_band as enum ('0-5', '6-10', '11-18', '19+');
create type app_golfcourseranks_com_.feedback_kind as enum ('bug', 'feature', 'general');

create or replace function app_golfcourseranks_com_.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table app_golfcourseranks_com_.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  handle text not null unique,
  display_name text,
  handicap_band app_golfcourseranks_com_.handicap_band,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint users_handle_format check (handle ~ '^[a-z0-9][a-z0-9-]{1,30}$')
);

create table app_golfcourseranks_com_.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  state text not null,
  par smallint,
  slope integer,
  rating numeric(4, 1),
  price_band smallint,
  seed_source jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint courses_price_band check (price_band between 1 and 5),
  constraint courses_identity unique (name, city, state)
);

create table app_golfcourseranks_com_.user_courses (
  user_id uuid not null references app_golfcourseranks_com_.users (id) on delete cascade,
  course_id uuid not null references app_golfcourseranks_com_.courses (id) on delete cascade,
  played_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, course_id)
);

create table app_golfcourseranks_com_.user_rankings (
  user_id uuid not null references app_golfcourseranks_com_.users (id) on delete cascade,
  course_id uuid not null references app_golfcourseranks_com_.courses (id) on delete cascade,
  rank_index integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, course_id),
  constraint user_rankings_rank_index_positive check (rank_index >= 0),
  constraint user_rankings_unique_rank unique (user_id, rank_index)
);

create table app_golfcourseranks_com_.pairwise_signals (
  id bigint generated always as identity primary key,
  user_id uuid not null references app_golfcourseranks_com_.users (id) on delete cascade,
  winner_course_id uuid not null references app_golfcourseranks_com_.courses (id) on delete cascade,
  loser_course_id uuid not null references app_golfcourseranks_com_.courses (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint pairwise_signals_distinct_courses check (winner_course_id <> loser_course_id),
  constraint pairwise_signals_unique_pair unique (user_id, winner_course_id, loser_course_id)
);

create table app_golfcourseranks_com_.course_ratings (
  course_id uuid primary key references app_golfcourseranks_com_.courses (id) on delete cascade,
  score numeric(10, 2) not null default 1500,
  normalized_score numeric(5, 1) not null default 0,
  rank integer,
  wins integer not null default 0,
  losses integer not null default 0,
  num_signals integer not null default 0,
  num_unique_golfers integer not null default 0,
  is_eligible boolean not null default false,
  last_refreshed_at timestamptz not null default timezone('utc', now())
);

create table app_golfcourseranks_com_.follows (
  follower_user_id uuid not null references app_golfcourseranks_com_.users (id) on delete cascade,
  followed_user_id uuid not null references app_golfcourseranks_com_.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (follower_user_id, followed_user_id),
  constraint follows_no_self_follow check (follower_user_id <> followed_user_id)
);

create table app_golfcourseranks_com_.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_golfcourseranks_com_.users (id) on delete set null,
  feedback_type app_golfcourseranks_com_.feedback_kind not null,
  screen_name text not null,
  current_url text not null,
  message text not null,
  browser_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint feedback_message_length check (char_length(trim(message)) >= 4)
);

create index users_handle_idx on app_golfcourseranks_com_.users (handle);
create index courses_state_name_idx on app_golfcourseranks_com_.courses (state, name);
create index user_rankings_user_rank_idx on app_golfcourseranks_com_.user_rankings (user_id, rank_index);
create index pairwise_signals_winner_idx on app_golfcourseranks_com_.pairwise_signals (winner_course_id);
create index pairwise_signals_loser_idx on app_golfcourseranks_com_.pairwise_signals (loser_course_id);
create index follows_followed_idx on app_golfcourseranks_com_.follows (followed_user_id);
create index feedback_created_at_idx on app_golfcourseranks_com_.feedback (created_at desc);

create trigger users_set_updated_at
before update on app_golfcourseranks_com_.users
for each row execute function app_golfcourseranks_com_.set_updated_at();

create trigger courses_set_updated_at
before update on app_golfcourseranks_com_.courses
for each row execute function app_golfcourseranks_com_.set_updated_at();

create trigger user_courses_set_updated_at
before update on app_golfcourseranks_com_.user_courses
for each row execute function app_golfcourseranks_com_.set_updated_at();

create trigger user_rankings_set_updated_at
before update on app_golfcourseranks_com_.user_rankings
for each row execute function app_golfcourseranks_com_.set_updated_at();

create trigger pairwise_signals_set_updated_at
before update on app_golfcourseranks_com_.pairwise_signals
for each row execute function app_golfcourseranks_com_.set_updated_at();

create trigger feedback_set_updated_at
before update on app_golfcourseranks_com_.feedback
for each row execute function app_golfcourseranks_com_.set_updated_at();

create or replace function app_golfcourseranks_com_.refresh_course_ratings(
  min_golfers integer default 2,
  min_signals integer default 6
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

create or replace function app_golfcourseranks_com_.rebuild_user_pairwise_signals(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = app_golfcourseranks_com_, public
as $$
begin
  delete from app_golfcourseranks_com_.pairwise_signals
  where user_id = target_user_id;

  insert into app_golfcourseranks_com_.pairwise_signals (
    user_id,
    winner_course_id,
    loser_course_id
  )
  select
    higher.user_id,
    higher.course_id,
    lower.course_id
  from app_golfcourseranks_com_.user_rankings higher
  join app_golfcourseranks_com_.user_rankings lower
    on lower.user_id = higher.user_id
   and lower.rank_index > higher.rank_index
  where higher.user_id = target_user_id;

  perform app_golfcourseranks_com_.refresh_course_ratings();
end;
$$;

grant select on app_golfcourseranks_com_.users to anon, authenticated;
grant select on app_golfcourseranks_com_.courses to anon, authenticated;
grant select on app_golfcourseranks_com_.course_ratings to anon, authenticated;
grant select on app_golfcourseranks_com_.pairwise_signals to anon, authenticated;
grant select on app_golfcourseranks_com_.follows to anon, authenticated;
grant select on app_golfcourseranks_com_.user_courses to authenticated;
grant select on app_golfcourseranks_com_.user_rankings to authenticated;
grant select, insert, update on app_golfcourseranks_com_.feedback to authenticated;
grant insert, update on app_golfcourseranks_com_.users to authenticated;
grant insert, update, delete on app_golfcourseranks_com_.user_courses to authenticated;
grant insert, update, delete on app_golfcourseranks_com_.user_rankings to authenticated;
grant insert, delete on app_golfcourseranks_com_.follows to authenticated;
grant usage, select on all sequences in schema app_golfcourseranks_com_ to anon, authenticated, service_role;
grant execute on function app_golfcourseranks_com_.refresh_course_ratings(integer, integer) to authenticated, service_role;
grant execute on function app_golfcourseranks_com_.rebuild_user_pairwise_signals(uuid) to authenticated, service_role;

alter table app_golfcourseranks_com_.users enable row level security;
alter table app_golfcourseranks_com_.courses enable row level security;
alter table app_golfcourseranks_com_.user_courses enable row level security;
alter table app_golfcourseranks_com_.user_rankings enable row level security;
alter table app_golfcourseranks_com_.pairwise_signals enable row level security;
alter table app_golfcourseranks_com_.course_ratings enable row level security;
alter table app_golfcourseranks_com_.follows enable row level security;
alter table app_golfcourseranks_com_.feedback enable row level security;

create policy "Public profiles are viewable"
on app_golfcourseranks_com_.users
for select
using (true);

create policy "Users can create their profile"
on app_golfcourseranks_com_.users
for insert
with check (auth.uid() = id);

create policy "Users can update their profile"
on app_golfcourseranks_com_.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Courses are viewable by everyone"
on app_golfcourseranks_com_.courses
for select
using (true);

create policy "Played courses are owned by the player"
on app_golfcourseranks_com_.user_courses
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Rankings are owned by the player"
on app_golfcourseranks_com_.user_rankings
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Pairwise signals are public read-only"
on app_golfcourseranks_com_.pairwise_signals
for select
using (true);

create policy "Leaderboard ratings are public"
on app_golfcourseranks_com_.course_ratings
for select
using (true);

create policy "Follow graph is public"
on app_golfcourseranks_com_.follows
for select
using (true);

create policy "Users manage who they follow"
on app_golfcourseranks_com_.follows
for insert
with check (auth.uid() = follower_user_id);

create policy "Users can unfollow from their own graph"
on app_golfcourseranks_com_.follows
for delete
using (auth.uid() = follower_user_id);

create policy "Users can view their own feedback"
on app_golfcourseranks_com_.feedback
for select
using (auth.uid() = user_id);

create policy "Users can submit their own feedback"
on app_golfcourseranks_com_.feedback
for insert
with check (auth.uid() = user_id);
