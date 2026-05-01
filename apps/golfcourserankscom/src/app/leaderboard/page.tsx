import Link from "next/link";

import { getAllCourses, getAppOverviewStats, getLeaderboardCourses } from "@/lib/data";
import { formatLocation, pluralize } from "@/lib/ranking";
import { EDITORIAL_LISTS, HANDICAP_OPTIONS } from "@/lib/types";

const SORT_OPTIONS = [
  { value: "rank", label: "Crowd rank" },
  { value: "golf-digest-public", label: "Golf Digest" },
  { value: "golf-top-100", label: "GOLF.com" },
  { value: "golfweek-you-can-play", label: "Golfweek" },
  { value: "most-played", label: "Most golfers" },
  { value: "most-compared", label: "Most comparisons" }
] as const;

function formatEditorialPosition(position?: number) {
  return position ? `#${position}` : "-";
}

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

  const states = Array.from(new Set(allCourses.map((course) => course.state))).sort((left, right) =>
    left.localeCompare(right)
  );

  return (
    <section className="shell-panel rounded-[2.4rem] p-6 sm:p-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <p className="section-label">National leaderboard</p>
              <h1 className="brand-heading mt-4 text-[2.35rem] font-semibold leading-[0.95] tracking-[-0.05em] text-[var(--ink)] sm:text-5xl">
                Crowd-ranked public courses with the editorial lists right beside them.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)] sm:text-lg sm:leading-8">
                The board defaults to golfer rankings. The editorial columns show where each course sits inside the seeded Golf Digest, GOLF.com, and Golfweek public-course lineups that helped start the network.
              </p>
            </div>

          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-[var(--pine-soft)] px-4 py-2 text-sm font-semibold text-[var(--pine)]">
              {pluralize(stats.golferCount, "golfer")}
            </span>
            <span className="rounded-full border border-[var(--line)] bg-white/85 px-4 py-2 text-sm font-semibold text-[var(--muted)]">
              {pluralize(stats.signalCount, "comparison")}
            </span>
            <span className="rounded-full border border-[var(--line)] bg-white/85 px-4 py-2 text-sm font-semibold text-[var(--muted)]">
              {pluralize(stats.courseCount, "public course")}
            </span>
          </div>
        </div>

        <form action="/leaderboard" className="grid gap-4 rounded-[1.9rem] border border-[var(--line)] bg-white/72 p-4 lg:grid-cols-[1fr_1fr_1fr_1.2fr_auto] lg:items-end">
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

          <button type="submit" className="solid-button min-h-11 justify-center whitespace-nowrap">
            Apply
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm leading-6 text-[var(--muted)]">
            Crowd score reflects how often golfers keep a course near the top of their own list. Editorial columns show where the same course appeared in the seeded publication lineups.
          </p>
          <Link href="/me/courses" className="ghost-button min-h-11">
            Add your courses
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-[1.8rem] border border-dashed border-[var(--line)] px-5 py-10 text-sm leading-6 text-[var(--muted)]">
            No courses match that filter combination yet. Try another state, lower the comparison threshold, or switch back to all golfers.
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:hidden">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="rounded-[1.7rem] border border-[var(--line)] bg-white/92 p-4 shadow-[0_10px_28px_rgba(24,37,43,0.06)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--pine)]">
                        #{course.leaderboardRank}
                      </p>
                      <h2 className="mt-2 text-xl font-semibold leading-tight tracking-[-0.04em] text-[var(--ink)]">
                        {course.name}
                      </h2>
                      <p className="mt-2 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-2 text-sm font-semibold ${
                        course.numUniqueGolfers === 0
                          ? "border border-[rgba(217,191,141,0.4)] bg-[rgba(255,248,236,0.95)] text-[rgb(120,88,38)]"
                          : "bg-[var(--pine-soft)] text-[var(--pine)]"
                      }`}
                    >
                      {course.numUniqueGolfers === 0 ? "Starting score" : "Crowd score"} {course.normalizedScore.toFixed(1)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    <span className="rounded-full border border-[var(--line)] px-3 py-1">
                      {pluralize(course.numUniqueGolfers, "golfer")}
                    </span>
                    <span className="rounded-full border border-[var(--line)] px-3 py-1">
                      {pluralize(course.numSignals, "comparison")}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                    {EDITORIAL_LISTS.map((editorial) => (
                      <div key={editorial.key} className="rounded-[1.1rem] bg-[rgba(246,243,236,0.92)] px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                          {editorial.label}
                        </p>
                        <p className="mt-2 text-base font-semibold text-[var(--ink)]">
                          {formatEditorialPosition(course.editorialRanks?.[editorial.key])}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 inline-flex min-h-11 items-center rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)]">
                    View detail
                  </div>
                </Link>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-[1.9rem] border border-[var(--line)] bg-white/86 lg:block">
              <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full">
                <thead>
                  <tr className="border-b border-[var(--line)] bg-[rgba(255,255,255,0.88)] text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    <th className="px-5 py-4">Crowd</th>
                    <th className="px-5 py-4">Course</th>
                    <th className="px-5 py-4">Golfers</th>
                    {EDITORIAL_LISTS.map((editorial) => (
                      <th key={editorial.key} className="px-5 py-4">
                        {editorial.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id} className="border-b border-[var(--line)] last:border-b-0">
                      <td className="px-5 py-5 align-top">
                        <Link href={`/courses/${course.id}`} className="block min-w-[110px]">
                          <div className="text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
                            #{course.leaderboardRank}
                          </div>
                          <div
                            className={`mt-2 inline-flex rounded-full px-3 py-2 text-sm font-semibold ${
                              course.numUniqueGolfers === 0
                                ? "border border-[rgba(217,191,141,0.4)] bg-[rgba(255,248,236,0.95)] text-[rgb(120,88,38)]"
                                : "bg-[var(--pine-soft)] text-[var(--pine)]"
                            }`}
                          >
                            {course.numUniqueGolfers === 0 ? "Starting score" : "Crowd score"}{" "}
                            {course.normalizedScore.toFixed(1)}
                          </div>
                          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                            {course.isEarly
                              ? "Still building toward a fuller crowd ranking."
                              : "Crowd-backed by ranked golfer lists."}
                          </p>
                        </Link>
                      </td>
                      <td className="px-5 py-5 align-top">
                        <Link href={`/courses/${course.id}`} className="block">
                          <h2 className="text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{course.name}</h2>
                          <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {course.isEarly ? (
                              <span className="rounded-full bg-[rgba(217,191,141,0.18)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(120,88,38)]">
                                Building more golfer input
                              </span>
                            ) : null}
                            <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                              {pluralize(course.numSignals, "comparison")}
                            </span>
                          </div>
                        </Link>
                      </td>
                      <td className="px-5 py-5 align-top text-sm text-[var(--muted)]">
                        <div className="font-semibold text-[var(--ink)]">{pluralize(course.numUniqueGolfers, "golfer")}</div>
                        <div className="mt-2">{pluralize(course.numSignals, "comparison")}</div>
                      </td>
                      {EDITORIAL_LISTS.map((editorial) => (
                        <td key={editorial.key} className="px-5 py-5 align-top text-sm text-[var(--muted)]">
                          <div className="text-base font-semibold text-[var(--ink)]">
                            {formatEditorialPosition(course.editorialRanks?.[editorial.key])}
                          </div>
                          <div className="mt-2 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                            {course.editorialRanks?.[editorial.key] ? editorial.label : "Not listed"}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
