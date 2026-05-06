import Link from "next/link";

import { LeaderboardFilterPanel } from "@/components/LeaderboardFilterPanel";
import { getAllCourses, getAppOverviewStats, getLeaderboardCourses } from "@/lib/data";
import { formatLocation, pluralize } from "@/lib/ranking";
import { EDITORIAL_LISTS, HANDICAP_OPTIONS } from "@/lib/types";

const SORT_OPTIONS = [
  { value: "rank", label: "Crowd rank" },
  { value: "golf-digest-public", label: "Golf Digest" },
  { value: "golf-top-100", label: "GOLF.com" },
  { value: "golfweek-you-can-play", label: "Golfweek" },
  { value: "most-played", label: "Most golfers" }
] as const;

const MOBILE_RANK_STACK = [
  { key: "crowd", label: "Crowd" },
  { key: "golf-top-100", label: "GOLF.com" },
  { key: "golf-digest-public", label: "Golf Digest" },
  { key: "golfweek-you-can-play", label: "Golfweek" }
] as const;

function formatEditorialPosition(position?: number) {
  return position ? `#${position}` : "-";
}

function getEarlySignalLabel(course: { isEarly: boolean; numUniqueGolfers: number; numSignals: number }) {
  if (!course.isEarly) {
    return null;
  }

  if (course.numUniqueGolfers === 0) {
    return "No golfer data yet";
  }

  return `${course.numUniqueGolfers} golfer${course.numUniqueGolfers === 1 ? "" : "s"} so far`;
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
      limit: 400
    }),
    getAllCourses()
  ]);

  const states = Array.from(new Set(allCourses.map((course) => course.state))).sort((left, right) =>
    left.localeCompare(right)
  );

  return (
    <section className="shell-panel shell-panel-contrast rounded-[2.4rem] p-6 sm:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <h1 className="brand-heading text-[2.2rem] font-semibold leading-[0.95] tracking-[-0.05em] text-[var(--ink)] sm:text-5xl">
            National Leaderboard
          </h1>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-[var(--pine-soft)] px-4 py-2 text-sm font-semibold text-[var(--pine)]">
              {pluralize(stats.golferCount, "golfer")}
            </span>
            <span className="rounded-full border border-[var(--line)] bg-white/85 px-4 py-2 text-sm font-semibold text-[var(--muted)]">
              {pluralize(stats.courseCount, "public course")}
            </span>
          </div>
        </div>

        <LeaderboardFilterPanel
          band={band ?? ""}
          selectedState={selectedState}
          sort={sort}
          minSignals={minSignals}
          states={states}
        />

        {courses.length === 0 ? (
            <div className="rounded-[1.8rem] border border-dashed border-[var(--line)] px-5 py-10 text-sm leading-6 text-[var(--muted)]">
              No courses match that filter combination yet. Try another state, another handicap band, or switch back to all golfers.
            </div>
        ) : (
          <>
            <div className="grid gap-4 lg:hidden">
              {courses.map((course) => {
                const earlySignalLabel = getEarlySignalLabel(course);

                return (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="w-full overflow-hidden rounded-[1.7rem] border border-[var(--line)] bg-white/92 p-4 shadow-[0_10px_28px_rgba(24,37,43,0.06)]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="shrink-0 rounded-full bg-[var(--pine-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--pine)]">
                        #{course.leaderboardRank}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <h2 className="min-w-0 text-[1.8rem] font-semibold leading-[1.02] tracking-[-0.05em] text-[var(--ink)] [overflow-wrap:anywhere]">
                            {course.name}
                          </h2>
                          <span className="shrink-0 pt-1 text-lg text-[var(--muted)]" aria-hidden="true">
                            &gt;
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-[minmax(0,1fr)_9.75rem] items-start gap-3">
                      <div className="min-w-0 space-y-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-2 text-sm font-semibold ${
                            course.numUniqueGolfers === 0
                              ? "border border-[rgba(217,191,141,0.4)] bg-[rgba(255,248,236,0.95)] text-[rgb(120,88,38)]"
                              : "bg-[var(--pine-soft)] text-[var(--pine)]"
                          }`}
                        >
                          {course.numUniqueGolfers === 0 ? "Starting score" : "Crowd score"} {course.normalizedScore.toFixed(1)}
                        </span>
                        <div>
                          <span className="inline-flex rounded-full border border-[var(--line)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                            {pluralize(course.numUniqueGolfers, "golfer")}
                          </span>
                          {earlySignalLabel ? (
                            <p className="mt-2 text-xs leading-5 text-[rgb(120,88,38)]">{earlySignalLabel}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-[1.25rem] border border-[var(--line)] bg-[rgba(246,243,236,0.92)]">
                        {MOBILE_RANK_STACK.map((entry, index) => {
                          const value =
                            entry.key === "crowd"
                              ? `#${course.leaderboardRank}`
                              : formatEditorialPosition(course.editorialRanks?.[entry.key]);

                          return (
                            <div
                              key={entry.key}
                              className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2.5 ${
                                index === MOBILE_RANK_STACK.length - 1 ? "" : "border-b border-[rgba(28,41,36,0.08)]"
                              }`}
                            >
                              <span
                                className={`min-w-0 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                                  entry.key === "crowd" ? "text-[var(--ink)]" : "text-[var(--muted)]"
                                }`}
                              >
                                {entry.label}
                              </span>
                              <span className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink)]">{value}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="hidden overflow-hidden rounded-[1.9rem] border border-[var(--line)] bg-white/86 lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full">
                  <thead>
                    <tr className="border-b border-[var(--line)] bg-[rgba(255,255,255,0.88)] text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                      <th className="px-5 py-4" title="Crowd score = how golfers actually rank it.">Crowd</th>
                      <th className="px-5 py-4">Course</th>
                      <th className="px-5 py-4">Golfers</th>
                      {EDITORIAL_LISTS.map((editorial) => (
                        <th
                          key={editorial.key}
                          className="px-5 py-4"
                          title={`${editorial.label} position from the editorial starting lists.`}
                        >
                          {editorial.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => {
                      const earlySignalLabel = getEarlySignalLabel(course);

                      return (
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
                            </Link>
                          </td>
                          <td className="px-5 py-5 align-top">
                            <Link href={`/courses/${course.id}`} className="block">
                              <h2 className="text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{course.name}</h2>
                              <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                            </Link>
                          </td>
                          <td className="px-5 py-5 align-top text-sm text-[var(--muted)]">
                            <div className="font-semibold text-[var(--ink)]">{pluralize(course.numUniqueGolfers, "golfer")}</div>
                            {earlySignalLabel ? (
                              <div className="mt-2 text-xs leading-5 text-[rgb(120,88,38)]">{earlySignalLabel}</div>
                            ) : null}
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
                      );
                    })}
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
