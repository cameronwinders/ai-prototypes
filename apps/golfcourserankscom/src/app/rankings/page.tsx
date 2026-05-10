import Link from "next/link";

import { AvatarStack } from "@/components/InitialsAvatar";
import { LeaderboardFilterPanel } from "@/components/LeaderboardFilterPanel";
import { RankSignal } from "@/components/RankSignal";
import { getLeaderboardCourses } from "@/lib/data";
import { formatCrowdScore, formatLocation, formatRankPosition, getRankDeltaDisplay } from "@/lib/ranking";
import { EDITORIAL_LISTS, HANDICAP_OPTIONS, RANK_SIGNAL_OPTIONS, type RankSignalFilter } from "@/lib/types";
import { getViewerContext } from "@/lib/viewer";

const SORT_OPTIONS = [
  { value: "rank", label: "Crowd rank" },
  { value: "editorial-average", label: "Editorial average" },
  { value: "crowd-vs-editorial", label: "Crowd vs. editorial" },
  { value: "golf-digest-public", label: "Golf Digest" },
  { value: "golf-top-100", label: "GOLF.com" },
  { value: "golfweek-you-can-play", label: "Golf Week" },
  { value: "most-played", label: "Most played" }
] as const;

const MOBILE_RANK_STACK = [
  { key: "crowd", label: "Crowd" },
  { key: "editorial", label: "Editorial avg" },
  { key: "golf-top-100", label: "GOLF.com" },
  { key: "golf-digest-public", label: "Golf Digest" },
  { key: "golfweek-you-can-play", label: "Golfweek" }
] as const;

function formatEditorialPosition(position?: number | null) {
  return formatRankPosition(position);
}

function GapBadge({ delta }: { delta: number | null }) {
  const display = getRankDeltaDisplay(delta);

  if (!display) {
    return <span className="pill pill-line pill-sentence">No editorial average</span>;
  }

  const isUp = display.direction === "up";
  const isFlat = display.direction === "flat";

  return (
    <span
      className={`pill pill-sentence ${
        isFlat ? "pill-line" : isUp ? "pill-pine" : "pill-warning"
      }`}
      title={display.label}
    >
      {isFlat ? "All Square" : `${display.value} ${isUp ? "Up" : "Down"}`}
    </span>
  );
}

export default async function RankingsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const bandParam = Array.isArray(params.band) ? params.band[0] : params.band;
  const stateParam = Array.isArray(params.state) ? params.state[0] : params.state;
  const sortParam = Array.isArray(params.sort) ? params.sort[0] : params.sort;
  const playedParam = Array.isArray(params.played) ? params.played[0] : params.played;
  const tagParam = Array.isArray(params.tag) ? params.tag[0] : params.tag;
  const activity = playedParam === "played" || playedParam === "not-played" ? playedParam : "all";
  const signal =
    RANK_SIGNAL_OPTIONS.some((option) => option.value === tagParam)
      ? (tagParam as RankSignalFilter)
      : "all";
  const viewer = await getViewerContext();

  const band = HANDICAP_OPTIONS.includes(bandParam as (typeof HANDICAP_OPTIONS)[number])
    ? (bandParam as (typeof HANDICAP_OPTIONS)[number])
    : null;
  const selectedState = stateParam?.trim().toUpperCase() ?? "";
  const sort = SORT_OPTIONS.some((option) => option.value === sortParam)
    ? (sortParam as (typeof SORT_OPTIONS)[number]["value"])
    : "rank";

  const courses = await getLeaderboardCourses({
    handicapBand: band,
    minSignals: 0,
    state: selectedState || null,
    sort,
    limit: 400,
    viewerId: viewer.user?.id ?? null,
    activity,
    signal
  });

  return (
    <section className="shell-panel shell-panel-contrast p-6 sm:p-8">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <h1 className="h2 text-[2rem] text-ink sm:text-[2.3rem]">National Rankings</h1>
          <p className="subhed max-w-3xl">
            Use "Sort by" to see crowd rankings, golf media rankings, or where they differ most.
          </p>
        </div>

        <LeaderboardFilterPanel sort={sort} />

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
                            ? formatRankPosition(course.leaderboardRank)
                            : entry.key === "editorial"
                              ? formatRankPosition(course.editorialAverageRank)
                              : formatEditorialPosition(course.editorialRanks?.[entry.key]);

                        const isCrowd = entry.key === "crowd";
                        const isEditorial = entry.key === "editorial";

                        return (
                          <div key={entry.key} className="contents">
                            <div
                              className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2.5 ${
                                isCrowd
                                  ? "bg-[rgba(49,107,83,0.16)]"
                                  : isEditorial
                                    ? "bg-[rgba(201,211,203,0.34)]"
                                    : "bg-transparent"
                              } ${
                                index === MOBILE_RANK_STACK.length - 1 && !isCrowd
                                  ? ""
                                  : "border-b border-[rgba(28,41,36,0.08)]"
                              }`}
                            >
                              <div className="min-w-0">
                                <span
                                  className={`block min-w-0 text-[11px] uppercase tracking-[0.14em] ${
                                    isCrowd
                                      ? "font-bold text-ink"
                                      : isEditorial
                                        ? "font-bold text-ink"
                                        : "font-semibold text-muted"
                                  }`}
                                >
                                  {entry.label}
                                </span>
                              </div>
                              <span
                                className={`text-sm tracking-[-0.02em] text-ink ${
                                  isCrowd || isEditorial ? "font-bold" : "font-semibold"
                                }`}
                              >
                                {value}
                              </span>
                            </div>
                            {isCrowd ? (
                              <div className="border-b border-[rgba(28,41,36,0.08)] bg-[rgba(201,211,203,0.18)] px-3 py-2">
                                <GapBadge delta={course.editorialGap} />
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-line bg-white/90 lg:block">
              <div className="grid grid-cols-[16%_27%_11%_12%_11%_11%_12%] border-b border-line bg-[rgba(255,255,255,0.98)] text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted shadow-[0_1px_0_rgba(28,41,36,0.08)] backdrop-blur lg:sticky lg:top-[5.35rem] lg:z-20 xl:top-[5.6rem]">
                <div className="px-4 py-4" title="Crowd score = how golfers actually rank it.">
                  Crowd
                </div>
                <div className="px-4 py-4">Course</div>
                <div
                  className="px-4 py-4"
                  title="Average of the available editorial rankings for this course."
                >
                  Editorial avg
                </div>
                <div
                  className="px-4 py-4"
                  title="How many ranking spots better or worse the crowd has this course versus the editorial average."
                >
                  Crowd vs editorial
                </div>
                {EDITORIAL_LISTS.map((editorial) => (
                  <div
                    key={editorial.key}
                    className="px-4 py-4"
                    title={`${editorial.label} position from the seeded editorial lists.`}
                  >
                    {editorial.label}
                  </div>
                ))}
              </div>
              <div>
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="grid grid-cols-[16%_27%_11%_12%_11%_11%_12%] border-b border-line last:border-b-0"
                  >
                    <div className="px-4 py-5 align-top">
                      <Link href={`/courses/${course.id}`} className="block min-w-0">
                        <div className="font-display text-[2.2rem] font-semibold tracking-[var(--tracking-tighter)] text-ink">
                          #{course.leaderboardRank}
                        </div>
                        <div
                          className={`mt-2 inline-flex ${course.isEarly ? "pill pill-warning" : "pill pill-pine"} pill-sentence`}
                        >
                          {course.isEarly ? "Starting score" : "Crowd score"} {formatCrowdScore(course.normalizedScore)}
                        </div>
                        {course.rankSignal ? (
                          <div className="mt-2">
                            <RankSignal signal={course.rankSignal} />
                          </div>
                        ) : null}
                        {course.viewerPlayed ? <div className="mt-2 text-sm text-pine">Played by you</div> : null}
                        {course.friendPlayers?.length ? (
                          <div className="mt-3 flex items-center gap-2">
                            <AvatarStack people={course.friendPlayers} size="sm" max={3} />
                            <span className="text-xs uppercase tracking-[0.12em] text-muted">Friends played</span>
                          </div>
                        ) : null}
                      </Link>
                    </div>
                    <div className="px-4 py-5 align-top">
                      <Link href={`/courses/${course.id}`} className="block">
                        <h2 className="text-[1.28rem] font-semibold tracking-[var(--tracking-tight)] text-ink">{course.name}</h2>
                        <p className="meta mt-1">{formatLocation(course)}</p>
                      </Link>
                    </div>
                    <div className="px-4 py-5 align-top">
                      <div className="text-base font-semibold text-ink">{formatRankPosition(course.editorialAverageRank)}</div>
                    </div>
                    <div className="px-4 py-5 align-top">
                      <GapBadge delta={course.editorialGap} />
                    </div>
                    {EDITORIAL_LISTS.map((editorial) => (
                      <div key={editorial.key} className="px-4 py-5 align-top">
                        <div className="text-base font-semibold text-ink">
                          {formatEditorialPosition(course.editorialRanks?.[editorial.key])}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
