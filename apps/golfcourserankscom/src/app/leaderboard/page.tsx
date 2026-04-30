import Link from "next/link";

import { getAllCourses, getAppOverviewStats, getLeaderboardCourses } from "@/lib/data";
import { formatLocation, pluralize } from "@/lib/ranking";
import { HANDICAP_OPTIONS } from "@/lib/types";

const SORT_OPTIONS = [
  { value: "rank", label: "Leaderboard rank" },
  { value: "score", label: "Highest score" },
  { value: "most-played", label: "Most golfers" },
  { value: "most-compared", label: "Most comparisons" }
] as const;

export default async function LeaderboardPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const bandParam = Array.isArray(params.band) ? params.band[0] : params.band;
  const minSignalsParam = Array.isArray(params.minSignals) ? params.minSignals[0] : params.minSignals;
  const stateParam = Array.isArray(params.state) ? params.state[0] : params.state;
  const sortParam = Array.isArray(params.sort) ? params.sort[0] : params.sort;

  const band = HANDICAP_OPTIONS.includes(bandParam as (typeof HANDICAP_OPTIONS)[number])
    ? (bandParam as (typeof HANDICAP_OPTIONS)[number])
    : null;
  const minSignals = Number.isFinite(Number(minSignalsParam)) ? Math.max(0, Number(minSignalsParam)) : 0;
  const selectedState = stateParam?.trim().toUpperCase() ?? "";
  const sort = SORT_OPTIONS.some((option) => option.value === sortParam)
    ? (sortParam as (typeof SORT_OPTIONS)[number]["value"])
    : "rank";

  const [stats, courses, allCourses] = await Promise.all([
    getAppOverviewStats(),
    getLeaderboardCourses({
      handicapBand: band,
      minSignals,
      state: selectedState || null,
      sort,
      limit: 200
    }),
    getAllCourses()
  ]);

  const states = Array.from(new Set(allCourses.map((course) => course.state))).sort((left, right) => left.localeCompare(right));
  const crowdCourses = courses.filter((course) => !course.isEarly);
  const earlyCourses = courses.filter((course) => course.isEarly);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="shell-panel rounded-[2.4rem] p-6 sm:p-8">
          <p className="section-label">National leaderboard</p>
          <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)] sm:text-[5rem]">
            Public courses ranked by golfers, not by star ratings.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--muted)]">
            Every list on Golf Course Ranks comes from golfers ordering the public courses they have actually played. The result is a cleaner, more useful board for trip planning, bucket lists, and golf-group debates.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full bg-[var(--pine-soft)] px-4 py-2 text-sm font-semibold text-[var(--pine)]">
              {pluralize(stats.golferCount, "golfer")}
            </span>
            <span className="rounded-full border border-[var(--line)] bg-white/85 px-4 py-2 text-sm font-semibold text-[var(--muted)]">
              {pluralize(stats.signalCount, "comparison")}
            </span>
            <span className="rounded-full border border-[var(--line)] bg-white/85 px-4 py-2 text-sm font-semibold text-[var(--muted)]">
              Scores rise when more golfers keep a course near the top of their own list
            </span>
          </div>
        </div>

        <section className="shell-panel rounded-[2rem] p-6">
          <form className="grid gap-4" action="/leaderboard">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-[var(--ink)]">Handicap band</label>
                <select
                  name="band"
                  defaultValue={band ?? ""}
                  className="mt-2 min-h-11 w-full rounded-[1.2rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                >
                  <option value="">All golfers</option>
                  {HANDICAP_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-[var(--ink)]">State</label>
                <select
                  name="state"
                  defaultValue={selectedState}
                  className="mt-2 min-h-11 w-full rounded-[1.2rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                >
                  <option value="">All states</option>
                  {states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-[var(--ink)]">Sort by</label>
                <select
                  name="sort"
                  defaultValue={sort}
                  className="mt-2 min-h-11 w-full rounded-[1.2rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-[var(--ink)]">Minimum comparisons</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  name="minSignals"
                  defaultValue={String(minSignals)}
                  className="mt-3 w-full"
                />
                <p className="mt-2 text-sm text-[var(--muted)]">Showing courses with at least {minSignals} comparisons.</p>
              </div>
            </div>

            <button type="submit" className="solid-button min-h-11 justify-center">
              Apply filters
            </button>
          </form>
        </section>
      </section>

      <section className="shell-panel rounded-[2rem] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-label">Live board</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
              Crowd-ranked public courses
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Live rows below come from saved golfer orderings. Courses still building enough participation appear separately as editorial starting points.
            </p>
          </div>
          <Link href="/courses" className="ghost-button min-h-11">
            Add played courses
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="mt-6 rounded-[1.8rem] border border-dashed border-[var(--line)] px-5 py-10 text-sm leading-6 text-[var(--muted)]">
            No courses match that filter combination yet. Try another state, lower the comparison threshold, or switch back to all golfers.
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {crowdCourses.length > 0 ? (
              <div className="overflow-hidden rounded-[1.8rem] border border-[var(--line)]">
                <div className="hidden grid-cols-[78px_1.8fr_1fr_1fr] gap-4 bg-[rgba(255,255,255,0.78)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)] md:grid">
                  <div>Rank</div>
                  <div>Course</div>
                  <div>Activity</div>
                  <div>Score</div>
                </div>
                <div className="divide-y divide-[var(--line)]">
                  {crowdCourses.map((course) => (
                    <Link
                      key={course.id}
                      href={`/courses/${course.id}`}
                      className="grid gap-3 bg-white/90 px-5 py-4 transition hover:bg-white md:grid-cols-[78px_1.8fr_1fr_1fr] md:items-center"
                    >
                      <div className="text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">#{course.leaderboardRank}</div>
                      <div>
                        <h3 className="text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{course.name}</h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                      </div>
                      <div className="text-sm text-[var(--muted)]">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                            {pluralize(course.numUniqueGolfers, "golfer")}
                          </span>
                          <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                            {pluralize(course.numSignals, "comparison")}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="inline-flex rounded-full bg-[var(--pine-soft)] px-3 py-2 text-sm font-semibold text-[var(--pine)]">
                          Crowd score {course.normalizedScore.toFixed(1)}
                        </div>
                        <p className="mt-2 text-xs text-[var(--muted)]">
                          Built from saved golfer orderings across the network.
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-[1.8rem] border border-dashed border-[var(--line)] px-5 py-8 text-sm leading-6 text-[var(--muted)]">
                No courses have cleared the live-crowd threshold for this filter combination yet. The editorial watchlist below keeps the board useful while more golfers add rankings.
              </div>
            )}

            {earlyCourses.length > 0 ? (
              <div className="rounded-[1.8rem] border border-[var(--line)] bg-[rgba(255,255,255,0.76)] p-5">
                <div>
                  <p className="section-label">Editorial watchlist</p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                    Strong public courses still building enough golfer signal
                  </h3>
                </div>
                <div className="mt-5 grid gap-3">
                  {earlyCourses.map((course) => (
                    <Link
                      key={course.id}
                      href={`/courses/${course.id}`}
                      className="grid gap-3 rounded-[1.5rem] border border-[var(--line)] bg-white/90 px-4 py-4 transition hover:bg-white md:grid-cols-[78px_1.6fr_1fr_1fr] md:items-center"
                    >
                      <div className="text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">#{course.leaderboardRank}</div>
                      <div>
                        <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">{course.name}</h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-[var(--muted)]">
                        <span className="rounded-full bg-[rgba(217,191,141,0.18)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(120,88,38)]">
                          Editorial starting point
                        </span>
                        <span>{pluralize(course.numUniqueGolfers, "golfer")}</span>
                        <span>{pluralize(course.numSignals, "comparison")}</span>
                      </div>
                      <div>
                        <div className="inline-flex rounded-full border border-[rgba(217,191,141,0.4)] bg-[rgba(255,248,236,0.95)] px-3 py-2 text-sm font-semibold text-[rgb(120,88,38)]">
                          Starting score {course.normalizedScore.toFixed(1)}
                        </div>
                        <p className="mt-2 text-xs text-[var(--muted)]">
                          Editorial lift only until more golfers rank this course.
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
