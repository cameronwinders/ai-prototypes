create schema if not exists app_golfcourserankscom_;

grant usage on schema app_golfcourserankscom_ to anon, authenticated, service_role;

create extension if not exists pgcrypto;

create type app_golfcourserankscom_.handicap_band as enum ('0-5', '6-10', '11-18', '19+');
create type app_golfcourserankscom_.feedback_kind as enum ('bug', 'feature', 'general');
create type app_golfcourserankscom_.friendship_status as enum ('pending', 'accepted');

create or replace function app_golfcourserankscom_.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table app_golfcourserankscom_.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  handle text not null unique,
  display_name text,
  handicap_band app_golfcourserankscom_.handicap_band,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint users_handle_format check (handle ~ '^[a-z0-9][a-z0-9-]{1,30}$')
);

create table app_golfcourserankscom_.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  state text not null,
  par smallint,
  slope integer,
  rating numeric(4, 1),
  price_band smallint,
  seed_rank integer not null,
  seed_score numeric(10, 2) not null,
  seed_source jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint courses_price_band check (price_band between 1 and 5),
  constraint courses_seed_rank_positive check (seed_rank > 0),
  constraint courses_identity unique (name, city, state)
);

create table app_golfcourserankscom_.played_courses (
  user_id uuid not null references app_golfcourserankscom_.users (id) on delete cascade,
  course_id uuid not null references app_golfcourserankscom_.courses (id) on delete cascade,
  note text,
  played_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, course_id)
);

create table app_golfcourserankscom_.user_course_ranks (
  user_id uuid not null references app_golfcourserankscom_.users (id) on delete cascade,
  course_id uuid not null references app_golfcourserankscom_.courses (id) on delete cascade,
  rank_position integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, course_id),
  constraint user_course_ranks_rank_positive check (rank_position >= 0),
  constraint user_course_ranks_unique_rank unique (user_id, rank_position)
);

create table app_golfcourserankscom_.pairwise_signals (
  id bigint generated always as identity primary key,
  user_id uuid not null references app_golfcourserankscom_.users (id) on delete cascade,
  winner_course_id uuid not null references app_golfcourserankscom_.courses (id) on delete cascade,
  loser_course_id uuid not null references app_golfcourserankscom_.courses (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint pairwise_signals_distinct_courses check (winner_course_id <> loser_course_id),
  constraint pairwise_signals_unique_pair unique (user_id, winner_course_id, loser_course_id)
);

create table app_golfcourserankscom_.course_aggregates (
  course_id uuid primary key references app_golfcourserankscom_.courses (id) on delete cascade,
  score numeric(10, 2) not null default 0,
  normalized_score numeric(5, 1) not null default 0,
  rank integer not null default 0,
  crowd_score numeric(10, 2) not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  num_signals integer not null default 0,
  num_unique_golfers integer not null default 0,
  is_early boolean not null default true,
  last_refreshed_at timestamptz not null default timezone('utc', now())
);

create table app_golfcourserankscom_.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references app_golfcourserankscom_.users (id) on delete cascade,
  addressee_user_id uuid not null references app_golfcourserankscom_.users (id) on delete cascade,
  status app_golfcourserankscom_.friendship_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  responded_at timestamptz,
  constraint friendships_no_self_request check (requester_user_id <> addressee_user_id),
  constraint friendships_unique_direction unique (requester_user_id, addressee_user_id)
);

create table app_golfcourserankscom_.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_golfcourserankscom_.users (id) on delete set null,
  feedback_type app_golfcourserankscom_.feedback_kind not null,
  screen_name text not null,
  current_url text not null,
  message text not null,
  browser_context jsonb not null default '{}'::jsonb,
  client_submission_id text unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint feedback_message_length check (char_length(trim(message)) >= 4)
);

create index users_email_idx on app_golfcourserankscom_.users (lower(email));
create index courses_seed_rank_idx on app_golfcourserankscom_.courses (seed_rank);
create index courses_state_name_idx on app_golfcourserankscom_.courses (state, name);
create index user_course_ranks_user_rank_idx on app_golfcourserankscom_.user_course_ranks (user_id, rank_position);
create index pairwise_signals_user_idx on app_golfcourserankscom_.pairwise_signals (user_id);
create index pairwise_signals_winner_idx on app_golfcourserankscom_.pairwise_signals (winner_course_id);
create index pairwise_signals_loser_idx on app_golfcourserankscom_.pairwise_signals (loser_course_id);
create index friendships_requester_idx on app_golfcourserankscom_.friendships (requester_user_id);
create index friendships_addressee_idx on app_golfcourserankscom_.friendships (addressee_user_id);
create index feedback_created_at_idx on app_golfcourserankscom_.feedback (created_at desc);

create trigger users_set_updated_at
before update on app_golfcourserankscom_.users
for each row execute function app_golfcourserankscom_.set_updated_at();

create trigger courses_set_updated_at
before update on app_golfcourserankscom_.courses
for each row execute function app_golfcourserankscom_.set_updated_at();

create trigger played_courses_set_updated_at
before update on app_golfcourserankscom_.played_courses
for each row execute function app_golfcourserankscom_.set_updated_at();

create trigger user_course_ranks_set_updated_at
before update on app_golfcourserankscom_.user_course_ranks
for each row execute function app_golfcourserankscom_.set_updated_at();

create trigger feedback_set_updated_at
before update on app_golfcourserankscom_.feedback
for each row execute function app_golfcourserankscom_.set_updated_at();

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

create or replace function app_golfcourserankscom_.rebuild_user_pairwise_signals(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = app_golfcourserankscom_, public
as $$
begin
  delete from app_golfcourserankscom_.pairwise_signals
  where user_id = target_user_id;

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
  where higher.user_id = target_user_id;

  perform app_golfcourserankscom_.refresh_course_aggregates();
end;
$$;

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
select
  c.id,
  c.seed_score,
  round((((max(c.seed_score) over ()) - c.seed_score) / nullif((max(c.seed_score) over ()) - (min(c.seed_score) over ()), 0) * -100 + 100)::numeric, 1),
  dense_rank() over (order by c.seed_score desc, c.seed_rank asc),
  0,
  0,
  0,
  0,
  0,
  true,
  timezone('utc', now())
from app_golfcourserankscom_.courses c
on conflict (course_id) do nothing;

grant select on app_golfcourserankscom_.courses to anon, authenticated;
grant select on app_golfcourserankscom_.course_aggregates to anon, authenticated;
grant select on app_golfcourserankscom_.users to authenticated;
grant select on app_golfcourserankscom_.pairwise_signals to authenticated;
grant select, insert, update, delete on app_golfcourserankscom_.played_courses to authenticated;
grant select, insert, update, delete on app_golfcourserankscom_.user_course_ranks to authenticated;
grant select, insert, update on app_golfcourserankscom_.friendships to authenticated;
grant select, insert, update on app_golfcourserankscom_.feedback to authenticated;
grant insert, update on app_golfcourserankscom_.users to authenticated;
grant usage, select on all sequences in schema app_golfcourserankscom_ to anon, authenticated, service_role;
grant execute on function app_golfcourserankscom_.refresh_course_aggregates() to authenticated, service_role;
grant execute on function app_golfcourserankscom_.rebuild_user_pairwise_signals(uuid) to authenticated, service_role;

alter table app_golfcourserankscom_.users enable row level security;
alter table app_golfcourserankscom_.courses enable row level security;
alter table app_golfcourserankscom_.played_courses enable row level security;
alter table app_golfcourserankscom_.user_course_ranks enable row level security;
alter table app_golfcourserankscom_.pairwise_signals enable row level security;
alter table app_golfcourserankscom_.course_aggregates enable row level security;
alter table app_golfcourserankscom_.friendships enable row level security;
alter table app_golfcourserankscom_.feedback enable row level security;

create policy "Courses are public"
on app_golfcourserankscom_.courses
for select
using (true);

create policy "Course aggregates are public"
on app_golfcourserankscom_.course_aggregates
for select
using (true);

create policy "Users create their own profile"
on app_golfcourserankscom_.users
for insert
with check (auth.uid() = id);

create policy "Users update their own profile"
on app_golfcourserankscom_.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can read their own profile"
on app_golfcourserankscom_.users
for select
using (auth.uid() = id);

create policy "Played courses belong to owner"
on app_golfcourserankscom_.played_courses
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Rank rows belong to owner"
on app_golfcourserankscom_.user_course_ranks
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can view their own signals"
on app_golfcourserankscom_.pairwise_signals
for select
using (auth.uid() = user_id);

create policy "Friendships visible to participants"
on app_golfcourserankscom_.friendships
for select
using (auth.uid() = requester_user_id or auth.uid() = addressee_user_id);

create policy "Users can request friendships"
on app_golfcourserankscom_.friendships
for insert
with check (auth.uid() = requester_user_id);

create policy "Addressees can respond to friendships"
on app_golfcourserankscom_.friendships
for update
using (auth.uid() = addressee_user_id)
with check (auth.uid() = addressee_user_id);

create policy "Users can read their own feedback"
on app_golfcourserankscom_.feedback
for select
using (auth.uid() = user_id);

create policy "Users can write their own feedback"
on app_golfcourserankscom_.feedback
for insert
with check (auth.uid() = user_id);
