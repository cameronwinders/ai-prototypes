import Link from "next/link";

import { PairwiseDemo } from "@/components/PairwiseDemo";
import { getAppOverviewStats, getLeaderboardCourses } from "@/lib/data";
import { formatLocation, pluralize } from "@/lib/ranking";
import { getViewerContext } from "@/lib/viewer";

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

          <div className="relative min-h-[18rem] overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[linear-gradient(180deg,_rgba(231,242,235,0.92)_0%,_rgba(247,244,238,0.96)_52%,_rgba(232,222,196,0.78)_100%)]">
            <div className="absolute inset-x-0 top-0 h-[44%] bg-[radial-gradient(circle_at_30%_18%,_rgba(255,255,255,0.78),_transparent_32%),linear-gradient(180deg,_rgba(215,233,223,0.95)_0%,_rgba(238,245,240,0.72)_100%)]" />
            <div className="absolute left-[9%] top-[28%] h-16 w-16 rounded-full border border-white/80 bg-[rgba(255,255,255,0.58)] shadow-[0_10px_30px_rgba(21,42,35,0.08)]" />
            <div className="absolute inset-x-[8%] bottom-[24%] h-[30%] rounded-[999px] bg-[linear-gradient(180deg,_rgba(112,153,123,0.98)_0%,_rgba(70,113,83,0.98)_100%)] shadow-[0_24px_44px_rgba(35,58,47,0.18)]" />
            <div className="absolute bottom-[22%] left-[18%] h-[18%] w-[52%] rounded-[999px] border border-[rgba(255,255,255,0.55)] bg-[linear-gradient(180deg,_rgba(129,176,141,0.96)_0%,_rgba(91,134,103,0.96)_100%)]" />
            <div className="absolute bottom-[14%] right-[12%] h-[22%] w-[26%] rounded-[999px] bg-[linear-gradient(180deg,_rgba(232,215,184,0.98)_0%,_rgba(208,190,150,0.94)_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)]" />
            <div className="absolute bottom-[32%] left-[38%] h-[22%] w-[2px] bg-[rgba(52,88,66,0.62)]" />
            <div className="absolute bottom-[48%] left-[36.4%] h-5 w-5 rounded-full border-2 border-white bg-[var(--pine)] shadow-[0_4px_10px_rgba(18,37,29,0.18)]" />
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
