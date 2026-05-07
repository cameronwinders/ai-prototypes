import Link from "next/link";

import { AvatarStack } from "@/components/InitialsAvatar";
import { LeaderboardFilterPanel } from "@/components/LeaderboardFilterPanel";
import { RankSignal } from "@/components/RankSignal";
import { getAllCourses, getAppOverviewStats, getLeaderboardCourses } from "@/lib/data";
import { formatCrowdScore, formatLocation, pluralize } from "@/lib/ranking";
import { EDITORIAL_LISTS, HANDICAP_OPTIONS } from "@/lib/types";
import { getViewerContext } from "@/lib/viewer";

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
  return position ? `#${position}` : "\u2014";
}

function golferSignalLabel(count: number) {
  return count === 0 ? "No golfers yet" : pluralize(count, "golfer");
}

export default async function LeaderboardPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const bandParam = Array.isArray(params.band) ? params.band[0] : params.band;
  const stateParam = Array.isArray(params.state) ? params.state[0] : params.state;
  const sortParam = Array.isArray(params.sort) ? params.sort[0] : params.sort;
  const playedParam = Array.isArray(params.played) ? params.played[0] : params.played;
  const activity = playedParam === "played" || playedParam === "not-played" ? playedParam : "all";
  const viewer = await getViewerContext();

  const band = HANDICAP_OPTIONS.includes(bandParam as (typeof HANDICAP_OPTIONS)[number])
    ? (bandParam as (typeof HANDICAP_OPTIONS)[number])
    : null;
  const selectedState = stateParam?.trim().toUpperCase() ?? "";
  const sort = SORT_OPTIONS.some((option) => option.value === sortParam)
    ? (sortParam as (typeof SORT_OPTIONS)[number]["value"])
    : "rank";

  const [stats, courses, allCourses] = await Promise.all([
    getAppOverviewStats(),
    getLeaderboardCourses({
      handicapBand: band,
      minSignals: 0,
      state: selectedState || null,
      sort,
      limit: 400,
      viewerId: viewer.user?.id ?? null,
      activity
    }),
    getAllCourses()
  ]);

  const states = Array.from(new Set(allCourses.map((course) => course.state))).sort((left, right) =>
    left.localeCompare(right)
  );

  return (
    <section className="shell-panel shell-panel-contrast p-6 sm:p-8">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <h1 className="h2 text-[2rem] text-ink sm:text-[2.3rem]">National leaderboard</h1>
          <div className="flex flex-wrap gap-2.5">
            <span className="pill pill-pine pill-sentence">{pluralize(stats.golferCount, "golfer")}</span>
            <span className="pill pill-line pill-sentence">{pluralize(stats.courseCount, "public course")}</span>
          </div>
        </div>

        <LeaderboardFilterPanel
          band={band ?? ""}
          selectedState={selectedState}
          sort={sort}
          states={states}
          activity={activity}
          showActivityFilter={Boolean(viewer.user)}
        />

        {courses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line px-5 py-10 text-sm leading-6 text-muted">
            No courses match that filter right now. Try another state, switch back to all golfers, or reset the sort.
          </div>
        ) : (
          <>
            <div className="grid gap-3 lg:hidden">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="block rounded-lg border border-line bg-white/92 p-4 transition-[background-color,transform] duration-150 hover:-translate-y-px hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-start gap-3">
                        <span className="pill pill-pine">#{course.leaderboardRank}</span>
                        <div className="min-w-0">
                          <h2 className="text-[1.65rem] font-semibold leading-[1.02] tracking-[var(--tracking-tight)] text-ink [overflow-wrap:anywhere]">
                            {course.name}
                          </h2>
                          <p className="meta mt-2">{formatLocation(course)}</p>
                          {course.friendPlayers?.length ? (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="meta">Friends played</span>
                              <AvatarStack people={course.friendPlayers} size="sm" max={3} />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 pt-1 text-lg text-muted" aria-hidden="true">
                      &gt;
                    </span>
                  </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_10.5rem]">
                      <div className="min-w-0 space-y-3">
                        <span className={`pill ${course.isEarly ? "pill-warning" : "pill-pine"} pill-sentence`}>
                          {course.isEarly ? "Starting score" : "Crowd score"} {formatCrowdScore(course.normalizedScore)}
                        </span>
                        <span className="pill pill-line pill-sentence">{golferSignalLabel(course.numUniqueGolfers)}</span>
                        {course.viewerPlayed ? <span className="pill pill-pine pill-sentence">Played by you</span> : null}
                        {course.rankSignal ? (
                          <div>
                            <RankSignal signal={course.rankSignal} />
                          </div>
                        ) : null}
                      </div>

                    <div className="overflow-hidden rounded-md border border-line bg-[rgba(246,243,236,0.92)]">
                      {MOBILE_RANK_STACK.map((entry, index) => {
                        const value =
                          entry.key === "crowd"
                            ? `#${course.leaderboardRank}`
                            : formatEditorialPosition(course.editorialRanks?.[entry.key]);

                        const isCrowd = entry.key === "crowd";

                        return (
                          <div
                            key={entry.key}
                            className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2.5 ${
                              isCrowd ? "bg-[rgba(49,107,83,0.16)]" : "bg-transparent"
                            } ${
                              index === MOBILE_RANK_STACK.length - 1 ? "" : "border-b border-[rgba(28,41,36,0.08)]"
                            }`}
                          >
                            <span
                              className={`min-w-0 text-[11px] uppercase tracking-[0.14em] ${
                                isCrowd ? "font-bold text-ink" : "font-semibold text-muted"
                              }`}
                            >
                              {entry.label}
                            </span>
                            <span className={`text-sm tracking-[-0.02em] text-ink ${isCrowd ? "font-bold" : "font-semibold"}`}>
                              {value}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-line bg-white/90 lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full">
                  <thead>
                    <tr className="border-b border-line bg-[rgba(255,255,255,0.92)] text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                      <th className="px-5 py-4" title="Crowd score = how golfers actually rank it.">
                        Crowd
                      </th>
                      <th className="px-5 py-4">Course</th>
                      <th className="px-5 py-4">Golfers</th>
                      {EDITORIAL_LISTS.map((editorial) => (
                        <th
                          key={editorial.key}
                          className="px-5 py-4"
                          title={`${editorial.label} position from the seeded editorial lists.`}
                        >
                          {editorial.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course.id} className="border-b border-line last:border-b-0">
                        <td className="px-5 py-5 align-top">
                          <Link href={`/courses/${course.id}`} className="block min-w-[126px]">
                            <div className="font-display text-[2.2rem] font-semibold tracking-[var(--tracking-tighter)] text-ink">
                              #{course.leaderboardRank}
                            </div>
                            <div className={`mt-2 inline-flex ${course.isEarly ? "pill pill-warning" : "pill pill-pine"} pill-sentence`}>
                              {course.isEarly ? "Starting score" : "Crowd score"} {formatCrowdScore(course.normalizedScore)}
                            </div>
                            {course.rankSignal ? (
                              <div className="mt-2">
                                <RankSignal signal={course.rankSignal} />
                              </div>
                            ) : null}
                          </Link>
                        </td>
                        <td className="px-5 py-5 align-top">
                          <Link href={`/courses/${course.id}`} className="block">
                            <h2 className="text-[1.28rem] font-semibold tracking-[var(--tracking-tight)] text-ink">{course.name}</h2>
                            <p className="meta mt-1">{formatLocation(course)}</p>
                          </Link>
                        </td>
                        <td className="px-5 py-5 align-top">
                          <div className="text-base font-semibold text-ink">{golferSignalLabel(course.numUniqueGolfers)}</div>
                          {course.viewerPlayed ? <div className="mt-2 text-sm text-pine">Played by you</div> : null}
                          {course.friendPlayers?.length ? (
                            <div className="mt-3 flex items-center gap-2">
                              <AvatarStack people={course.friendPlayers} size="sm" max={3} />
                              <span className="text-xs uppercase tracking-[0.12em] text-muted">Friends played</span>
                            </div>
                          ) : null}
                        </td>
                        {EDITORIAL_LISTS.map((editorial) => (
                          <td key={editorial.key} className="px-5 py-5 align-top">
                            <div className="text-base font-semibold text-ink">
                              {formatEditorialPosition(course.editorialRanks?.[editorial.key])}
                            </div>
                            <div className="mt-2 text-xs uppercase tracking-[0.14em] text-muted">
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
