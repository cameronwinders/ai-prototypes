import type { Metadata } from "next";

import { CourseRow, CourseRowHeader, type CourseRowSortKey } from "@/components/CourseRow";
import { LeaderboardFilterPanel } from "@/components/LeaderboardFilterPanel";
import { RankingsMobileControls } from "@/components/RankingsMobileControls";
import { RankingsMobileRow } from "@/components/RankingsMobileRow";
import { ShareButton } from "@/components/ShareButton";
import { getLeaderboardCourses } from "@/lib/data";
import { HANDICAP_OPTIONS, RANK_SIGNAL_OPTIONS, type RankSignalFilter } from "@/lib/types";
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

// Sortable column keys — every SORT_OPTIONS value except "most-played" maps
// to a visible board column header (most-played is dropdown-only).
const SORTABLE_COLUMN_KEYS = [
  "rank",
  "editorial-average",
  "crowd-vs-editorial",
  "golf-digest-public",
  "golf-top-100",
  "golfweek-you-can-play"
] as const satisfies readonly CourseRowSortKey[];

const FILTER_PASSTHROUGH_PARAMS = ["q", "band", "state", "played", "tag"] as const;

function buildSortHref(
  targetSort: CourseRowSortKey,
  params: Record<string, string | string[] | undefined>
) {
  const next = new URLSearchParams();
  for (const key of FILTER_PASSTHROUGH_PARAMS) {
    const raw = params[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value) next.set(key, value);
  }
  next.set("sort", targetSort);
  return `/rankings?${next.toString()}`;
}

export const metadata: Metadata = {
  title: "Overall Rankings | Golf Course Ranks",
  description: "See where the crowd board disagrees with Golf Digest, GOLF.com, and Golfweek on one national rankings page."
};

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
            <p className="eyebrow">National rankings</p>
            <h1 className="h1 text-ink">Overall Rankings</h1>
            <p className="subhed-sm mt-2 max-w-3xl">
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

        <div className="hidden lg:block">
          <LeaderboardFilterPanel sort={sort} query={searchQuery} />
        </div>
        <RankingsMobileControls sort={sort} query={searchQuery} resultCount={courses.length} />

        {courses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line px-5 py-10 text-sm leading-6 text-muted">
            No courses match that search right now. Try another course name, city, or state, or clear the search.
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2 lg:hidden">
              {courses.map((course) => (
                <RankingsMobileRow key={course.id} course={course} />
              ))}
            </div>

            <div className="hidden lg:block">
              <CourseRowHeader
                sort={{
                  current: (SORTABLE_COLUMN_KEYS as readonly string[]).includes(sort)
                    ? (sort as CourseRowSortKey)
                    : "rank",
                  hrefFor: (key) => buildSortHref(key, params)
                }}
              />
              <div className="grid gap-0">
                {courses.map((course) => (
                  <CourseRow key={course.id} course={course} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
