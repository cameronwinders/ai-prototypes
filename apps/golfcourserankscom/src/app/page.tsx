import Link from "next/link";

import { PairwiseDemo } from "@/components/PairwiseDemo";
import { getAppOverviewStats, getLeaderboardCourses } from "@/lib/data";
import { formatLocation, pluralize } from "@/lib/ranking";
import { EDITORIAL_LISTS } from "@/lib/types";
import { getViewerContext } from "@/lib/viewer";

function formatEditorialPosition(position?: number) {
  return position ? `#${position}` : "—";
}

export default async function HomePage() {
  const viewer = await getViewerContext();
  const [leaderboard, stats] = await Promise.all([getLeaderboardCourses({ limit: 6 }), getAppOverviewStats()]);
  const previewCourses = leaderboard.slice(0, 3);

  return (
    <div className="space-y-6">
      <section className="shell-panel shell-panel-contrast rounded-[2.6rem] p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--pine-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--pine)]">
                National leaderboard
              </span>
              <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Real golfer rankings
              </span>
            </div>
            <h1 className="brand-heading mt-5 max-w-5xl text-5xl font-semibold tracking-[-0.06em] text-[var(--ink)] sm:text-[5.4rem]">
              The crowd-ranked list of U.S. public golf courses.
            </h1>
            <p className="mt-4 max-w-3xl text-xl font-medium italic leading-8 text-[var(--pine)]">
              Editorial Top 100s rank what panelists think. We rank what real golfers actually played.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full bg-[var(--pine-soft)] px-4 py-2 text-sm font-semibold text-[var(--pine)]">
                {pluralize(stats.golferCount, "golfer")} on the board
              </span>
              <span className="rounded-full border border-[var(--line)] bg-white/85 px-4 py-2 text-sm font-semibold text-[var(--muted)]">
                {pluralize(stats.courseCount, "course")} in the national lineup
              </span>
            </div>

            <div className="mt-8 flex flex-wrap items-start gap-3">
              <div className="flex flex-col gap-3">
                <Link
                  href={viewer.user ? (viewer.profile?.onboarding_completed ? "/me/courses" : "/onboarding") : "/sign-in?next=/me/courses"}
                  className="solid-button min-h-11"
                >
                  {viewer.user ? "Rank my courses" : "Start ranking"}
                </Link>
                <p className="pl-1 text-sm leading-6 text-[var(--muted)]">Rank your first 5 courses in under 2 minutes.</p>
              </div>
              <Link href="/leaderboard" className="ghost-button min-h-11">
                Explore the leaderboard
              </Link>
            </div>
          </div>

          <div className="relative min-h-[20rem] overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[linear-gradient(180deg,_rgba(230,241,234,0.98)_0%,_rgba(247,244,238,0.96)_56%,_rgba(231,221,194,0.86)_100%)] p-5 sm:p-6">
            <div className="absolute inset-x-0 top-0 h-[42%] bg-[radial-gradient(circle_at_18%_20%,_rgba(255,255,255,0.82),_transparent_30%),linear-gradient(180deg,_rgba(213,232,221,0.92)_0%,_rgba(237,244,239,0.36)_100%)]" />
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-[linear-gradient(180deg,_rgba(231,221,194,0.14)_0%,_rgba(223,210,179,0.58)_100%)]" />
            <div className="relative z-10 flex h-full flex-col justify-between gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--pine)]">Right now on the board</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">A snapshot of the courses golfers keep closest to the top.</p>
                </div>
                <div className="rounded-full border border-white/70 bg-white/72 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--pine)] shadow-[0_10px_25px_rgba(28,41,36,0.08)]">
                  Top 3
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-white/70 bg-white/78 p-4 shadow-[0_24px_60px_rgba(24,39,31,0.12)] backdrop-blur-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[var(--pine-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--pine)]">
                        #{previewCourses[0]?.leaderboardRank ?? 1}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Crowd favorite</span>
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
                      {previewCourses[0]?.name ?? "Pebble Beach Golf Links"}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {previewCourses[0] ? formatLocation(previewCourses[0]) : "Pebble Beach, CA"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {EDITORIAL_LISTS.map((editorial) => (
                        <span
                          key={editorial.key}
                          className="rounded-full border border-[var(--line)] bg-white/82 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]"
                        >
                          {editorial.label} {formatEditorialPosition(previewCourses[0]?.editorialRanks?.[editorial.key])}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[1.2rem] border border-[rgba(49,107,83,0.12)] bg-[rgba(216,231,221,0.76)] px-3 py-2 text-right">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[var(--pine)]">Crowd score</p>
                    <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                      {previewCourses[0]?.normalizedScore?.toFixed(1) ?? "100.0"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {previewCourses.slice(1, 3).map((course) => (
                    <div
                      key={course.id}
                      className="rounded-[1.3rem] border border-[rgba(28,41,36,0.08)] bg-white/82 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-[var(--linen)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                          #{course.leaderboardRank}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--pine)]">
                          {course.normalizedScore.toFixed(1)}
                        </span>
                      </div>
                      <p className="mt-3 text-base font-semibold tracking-[-0.03em] text-[var(--ink)]">{course.name}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {EDITORIAL_LISTS.map((editorial) => (
                          <span
                            key={editorial.key}
                            className="rounded-full border border-[var(--line)] bg-[rgba(246,243,236,0.92)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]"
                          >
                            {editorial.label} {formatEditorialPosition(course.editorialRanks?.[editorial.key])}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PairwiseDemo />

      <section className="shell-panel shell-panel-soft rounded-[2rem] p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Leaderboard preview</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Crowd score = how golfers actually rank it.</p>
          </div>
          <Link href="/leaderboard" className="ghost-button min-h-11">
            Open full board
          </Link>
        </div>

        <div className="mt-6 grid gap-3">
          {previewCourses.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`} className="rounded-[1.7rem] border border-[var(--line)] bg-white/92 p-4 transition hover:bg-white">
              <div className="grid gap-3 md:course-row-grid md:items-center">
                <div className="text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">#{course.leaderboardRank}</div>
                <div>
                  <h3 className="text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{course.name}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[var(--pine-soft)] px-3 py-2 text-sm font-semibold text-[var(--pine)]">
                    Crowd score {course.normalizedScore.toFixed(1)}
                  </span>
                  {EDITORIAL_LISTS.map((editorial) => (
                    <span
                      key={editorial.key}
                      className="rounded-full border border-[var(--line)] bg-[rgba(246,243,236,0.92)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]"
                    >
                      {editorial.label} {formatEditorialPosition(course.editorialRanks?.[editorial.key])}
                    </span>
                  ))}
                </div>
                <div className="text-sm text-[var(--muted)]">{pluralize(course.numUniqueGolfers, "golfer")}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
