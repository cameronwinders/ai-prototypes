import Link from "next/link";

import { CourseRow } from "@/components/CourseRow";
import { PairwiseDemo } from "@/components/PairwiseDemo";
import { getAppOverviewStats, getLeaderboardCourses } from "@/lib/data";
import { pluralize } from "@/lib/ranking";
import { getViewerContext } from "@/lib/viewer";

export default async function HomePage() {
  const viewer = await getViewerContext();
  const [leaderboard, stats] = await Promise.all([getLeaderboardCourses({ limit: 6 }), getAppOverviewStats()]);
  const previewCourses = leaderboard.slice(0, 3);

  return (
    <div className="space-y-6">
      <section className="shell-panel shell-panel-contrast p-6 sm:p-8 lg:p-10">
        <div>
          <h1 className="h1-display max-w-5xl text-[3.85rem] text-ink sm:text-[5.4rem]">
            The crowd-ranked list of U.S. public golf courses.
          </h1>
          <p className="subhed mt-4 max-w-3xl">
            Editorial Top 100s rank what panelists think. We rank what real golfers actually played.
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <span className="pill pill-pine pill-sentence">{pluralize(stats.golferCount, "golfer")} on the board</span>
            <span className="pill pill-line pill-sentence">3 editorial lists in view</span>
            <span className="pill pill-line pill-sentence">{pluralize(stats.courseCount, "course")} in the national lineup</span>
          </div>

          <div className="mt-8 flex flex-wrap items-start gap-3">
            <div className="flex flex-col gap-3">
              <Link
                href={viewer.user ? (viewer.profile?.onboarding_completed ? "/me/courses" : "/onboarding") : "/sign-in?next=/me/courses"}
                className="solid-button min-h-11"
              >
                {viewer.user ? "Rank my courses" : "Start ranking"}
              </Link>
              <p className="pl-1 text-sm leading-6 text-muted">Rank your first 5 courses in under 2 minutes.</p>
            </div>
            <Link href="/leaderboard" className="ghost-button min-h-11">
              Explore the leaderboard
            </Link>
          </div>
        </div>
      </section>

      <section className="shell-panel shell-panel-soft p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="h2 text-[1.85rem] text-ink">Leaderboard preview</h2>
          <Link href="/leaderboard" className="text-sm font-semibold tracking-[var(--tracking-normal)] text-pine transition-colors duration-150 hover:text-ink">
            Open full board
          </Link>
        </div>

        <div className="mt-6 grid gap-3">
          {previewCourses.map((course) => (
            <CourseRow key={course.id} course={course} href={`/courses/${course.id}`} actionLabel={pluralize(course.numUniqueGolfers, "golfer")} />
          ))}
        </div>

        <div className="mt-6">
          <Link href="/leaderboard" className="solid-button min-h-11">
            Open full board
          </Link>
        </div>
      </section>

      <PairwiseDemo />
    </div>
  );
}
