import Link from "next/link";
import type { Metadata } from "next";

import { AvatarStack } from "@/components/InitialsAvatar";
import { LeaderboardFilterPanel } from "@/components/LeaderboardFilterPanel";
import { RankGapBadge } from "@/components/RankGapBadge";
import { RankingsMobileStack } from "@/components/RankingsMobileStack";
import { RankSignal } from "@/components/RankSignal";
import { ShareButton } from "@/components/ShareButton";
import { getLeaderboardCourses } from "@/lib/data";
import { formatCrowdScore, formatLocation, formatRankPosition } from "@/lib/ranking";
import { EDITORIAL_LISTS, HANDICAP_OPTIONS, RANK_SIGNAL_OPTIONS, type RankSignalFilter } from "@/lib/types";
import { getSiteUrl } from "@/lib/supabase/env";
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

export const metadata: Metadata = {
  title: "Overall Rankings | Golf Course Ranks",
  description: "See where the crowd board disagrees with Golf Digest, GOLF.com, and Golfweek on one national rankings page."
};

function formatEditorialPosition(position?: number | null) {
  return formatRankPosition(position);
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
  const queryParam = Array.isArray(params.q) ? params.q[0] : params.q;
  const playedParam = Array.isArray(params.played) ? params.played[0] : params.played;
  const tagParam = Array.isArray(params.tag) ? params.tag[0] : params.tag;
  const activity = playedParam === "played" || playedParam === "not-played" ? playedParam : "all";
  const signal =
    RANK_SIGNAL_OPTIONS.some((option) => option.value === tagParam)
      ? (tagParam as RankSignalFilter)
      : "all";
  const viewer = await getViewerContext();
  const rankingsUrl = `${getSiteUrl()}/rankings?utm_source=share&utm_medium=overall_rankings&utm_campaign=rankings_share`;

  const band = HANDICAP_OPTIONS.includes(bandParam as (typeof HANDICAP_OPTIONS)[number])
    ? (bandParam as (typeof HANDICAP_OPTIONS)[number])
    : null;
  const selectedState = stateParam?.trim().toUpperCase() ?? "";
  const searchQuery = queryParam?.trim() ?? "";
  const sort = SORT_OPTIONS.some((option) => option.value === sortParam)
    ? (sortParam as (typeof SORT_OPTIONS)[number]["value"])
    : "rank";

  const allCourses = await getLeaderboardCourses({
    handicapBand: band,
    minSignals: 0,
    state: selectedState || null,
    sort,
    limit: 400,
    viewerId: viewer.user?.id ?? null,
    activity,
    signal
  });

  const normalizedQuery = searchQuery.toLowerCase();
  const courses = normalizedQuery
    ? allCourses.filter((course) =>
        [course.name, course.city, course.state].some((value) => value.toLowerCase().includes(normalizedQuery))
      )
    : allCourses;

  return (
    <section className="shell-panel shell-panel-contrast p-6 sm:p-8">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="h2 text-[2rem] text-ink sm:text-[2.3rem]">National Rankings</h1>
            <p className="subhed max-w-3xl">
              Use "Sort by" to see crowd rankings, golf media rankings, or where they differ most.
            </p>
          </div>
          <ShareButton
            title="Golf Course Ranks Overall Rankings"
            text="Compare the crowd board with Golf Digest, GOLF.com, and Golfweek on Golf Course Ranks."
            url={rankingsUrl}
            className="ghost-button min-h-11 shrink-0"
            analyticsSurface="rankings-page"
            buttonChildren="Share rankings"
          />
        </div>

        <LeaderboardFilterPanel sort={sort} query={searchQuery} />

        {courses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line px-5 py-10 text-sm leading-6 text-muted">
            No courses match that search right now. Try another course name, city, or state, or clear the search.
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

                    <RankingsMobileStack course={course} />
                  </div>
                </Link>
              ))}
            </div>

            <div className="hidden rounded-xl border border-line bg-white/90 lg:block">
              <div className="grid grid-cols-[16%_27%_11%_12%_11%_11%_12%] border-b border-line bg-[rgba(255,255,255,0.98)] text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted shadow-[0_1px_0_rgba(28,41,36,0.08)] backdrop-blur lg:sticky lg:top-[4.85rem] lg:z-20">
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
                      <RankGapBadge delta={course.editorialGap} />
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
