import Link from "next/link";

import { CoursesBrowser } from "@/components/CoursesBrowser";
import { getAllCourses, getAppOverviewStats, getLeaderboardCourses, getPlayedCoursesForUser } from "@/lib/data";
import { formatLocation, pluralize } from "@/lib/ranking";
import { getViewerContext } from "@/lib/viewer";

export default async function HomePage() {
  const viewer = await getViewerContext();
  const [stats, leaderboard, courses, playedCourses] = await Promise.all([
    getAppOverviewStats(),
    getLeaderboardCourses({ limit: 8 }),
    getAllCourses(),
    viewer.user ? getPlayedCoursesForUser(viewer.user.id) : Promise.resolve([])
  ]);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="shell-panel rounded-[2.5rem] p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--pine-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--pine)]">
              National leaderboard
            </span>
            <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Early / seeded
            </span>
          </div>
          <h1 className="brand-heading mt-5 max-w-4xl text-5xl font-semibold tracking-[-0.06em] text-[var(--ink)] sm:text-[5.4rem]">
            The crowd-ranked list of U.S. public courses, built from real golfer comparisons.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--muted)]">
            No editor scores. No generic 1–5 stars. Just golfers marking what they have played, dragging those rounds into order, and turning personal lists into one evolving national board.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={viewer.user ? (viewer.profile?.onboarding_completed ? "/me/courses" : "/onboarding") : "/sign-in?next=/me/courses"}
              className="solid-button min-h-11"
            >
              {viewer.user ? "Rank my courses" : "Start ranking"}
            </Link>
            <Link href="/leaderboard" className="ghost-button min-h-11">
              See the leaderboard
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {[
            { label: "Seeded courses", value: stats.courseCount },
            { label: "Onboarded golfers", value: stats.golferCount },
            { label: "Pairwise comparisons", value: stats.signalCount }
          ].map((item) => (
            <div key={item.label} className="shell-panel rounded-[2rem] p-5">
              <p className="text-sm text-[var(--muted)]">{item.label}</p>
              <p className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--ink)]">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="shell-panel rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-label">Leaderboard preview</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                What the early national board looks like right now
              </h2>
            </div>
            <Link href="/leaderboard" className="ghost-button min-h-11">
              Open full board
            </Link>
          </div>

          <div className="mt-6 grid gap-3">
            {leaderboard.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`} className="rounded-[1.7rem] border border-[var(--line)] bg-white/92 p-4 transition hover:bg-white">
                <div className="grid gap-3 md:course-row-grid md:items-center">
                  <div className="text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">#{course.leaderboardRank}</div>
                  <div>
                    <h3 className="text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{course.name}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[var(--pine-soft)] px-3 py-2 text-sm font-semibold text-[var(--pine)]">
                      {course.normalizedScore.toFixed(1)}
                    </span>
                    {course.isEarly ? (
                      <span className="rounded-full border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--muted)]">
                        Early / seeded
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-[var(--muted)]">
                    {pluralize(course.numUniqueGolfers, "golfer")}
                    <br />
                    {pluralize(course.numSignals, "comparison")}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <section className="shell-panel rounded-[2rem] p-6">
          <CoursesBrowser
            courses={courses}
            initialPlayedCourses={playedCourses}
            viewerSignedIn={Boolean(viewer.user)}
            viewerNeedsOnboarding={Boolean(viewer.user && !viewer.profile?.onboarding_completed)}
            defaultVisibleCount={18}
          />
        </section>
      </section>
    </div>
  );
}
