import Link from "next/link";

import { CoursesBrowser } from "@/components/CoursesBrowser";
import { PairwiseDemo } from "@/components/PairwiseDemo";
import { getAllCourses, getLeaderboardCourses, getPlayedCoursesForUser } from "@/lib/data";
import { formatLocation, pluralize } from "@/lib/ranking";
import { getViewerContext } from "@/lib/viewer";
import { getAppOverviewStats } from "@/lib/data";

export default async function HomePage() {
  const viewer = await getViewerContext();
  const [leaderboard, courses, playedCourses, stats] = await Promise.all([
    getLeaderboardCourses({ limit: 8 }),
    getAllCourses(),
    viewer.user ? getPlayedCoursesForUser(viewer.user.id) : Promise.resolve([]),
    getAppOverviewStats()
  ]);
  const crowdPreview = leaderboard.filter((course) => !course.isEarly && course.numUniqueGolfers > 0);
  const previewCourses = (crowdPreview.length > 0 ? crowdPreview : leaderboard).slice(0, 6);
  const showingFallbackPreview = crowdPreview.length === 0;

  return (
    <div className="space-y-6">
      <section className="shell-panel rounded-[2.6rem] p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--pine-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--pine)]">
                National leaderboard
              </span>
              <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Real golfer comparisons
              </span>
            </div>
            <h1 className="brand-heading mt-5 max-w-5xl text-5xl font-semibold tracking-[-0.06em] text-[var(--ink)] sm:text-[5.4rem]">
              The crowd-ranked list of U.S. public golf courses.
            </h1>
            <p className="mt-3 text-lg font-medium italic text-[var(--pine)]">
              Editorial Top 100s rank what panelists think. We rank what real golfers actually played.
            </p>
            <p className="mt-5 max-w-4xl text-lg leading-8 text-[var(--muted)]">
              Golf Course Ranks turns real golfer opinions into one clean national board. Crowd score = how golfers actually rank it. Browse the leaderboard, save the public courses you have played, compare your list with friends, and keep a running order of the rounds you would gladly book again.
            </p>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white/70">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Pebble_Beach_18th_hole.jpg/1280px-Pebble_Beach_18th_hole.jpg"
              alt="Pebble Beach Golf Links shoreline finishing hole"
              className="h-full min-h-[18rem] w-full object-cover"
            />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <span className="rounded-full bg-[var(--pine-soft)] px-4 py-2 text-sm font-semibold text-[var(--pine)]">
            {pluralize(stats.golferCount, "golfer")} on the board
          </span>
          <span className="rounded-full border border-[var(--line)] bg-white/85 px-4 py-2 text-sm font-semibold text-[var(--muted)]">
            {pluralize(stats.signalCount, "comparison")} saved so far
          </span>
          <span className="rounded-full border border-[var(--line)] bg-white/85 px-4 py-2 text-sm font-semibold text-[var(--muted)]">
            {pluralize(stats.courseCount, "course")} in the national lineup
          </span>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={viewer.user ? (viewer.profile?.onboarding_completed ? "/me/courses" : "/onboarding") : "/sign-in?next=/me/courses"}
            className="solid-button min-h-11"
          >
            {viewer.user ? "Rank my courses" : "Start ranking"}
          </Link>
          <Link href="/leaderboard" className="ghost-button min-h-11">
            Explore the leaderboard
          </Link>
          <Link href="/friends" className="ghost-button min-h-11">
            Follow friends and compare
          </Link>
        </div>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Rank your first 5 courses in under 2 minutes.
        </p>
      </section>

      <PairwiseDemo />

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="shell-panel rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-label">Live leaderboard preview</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                The courses golfers keep near the top
              </h2>
            </div>
            <Link href="/leaderboard" className="ghost-button min-h-11">
              Open full board
            </Link>
          </div>

          {showingFallbackPreview ? (
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              The crowd board is still growing, so this preview includes the editorial starting order until more golfers finish their lists.
            </p>
          ) : (
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              This preview only shows courses that already have live golfer participation behind them.
            </p>
          )}

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
                    {course.isEarly ? (
                      <span className="rounded-full border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--muted)]">
                        Early read
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
          <div className="mb-6 rounded-[1.8rem] border border-[var(--line)] bg-white/88 p-5">
            <p className="section-label">Social golf</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
              Follow golfers you trust and compare lists course by course.
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Add friends by email, unlock side-by-side ranking comparisons, and share your favorite courses or ranking list with the group chat before the next trip gets booked.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/friends" className="solid-button min-h-11">
                Open friends
              </Link>
              <Link href={viewer.profile?.handle ? `/u/${viewer.profile.handle}` : "/profile"} className="ghost-button min-h-11">
                See my profile
              </Link>
            </div>
          </div>

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
