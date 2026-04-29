import Link from "next/link";

import { getAppOverviewStats, getLeaderboardCourses, getSetupState } from "@/lib/data";
import { formatLocation, getPriceBandLabel } from "@/lib/ranking";
import { getViewerContext } from "@/lib/viewer";

export default async function LeaderboardPage() {
  const [viewer, courses, stats, setup] = await Promise.all([
    getViewerContext(),
    getLeaderboardCourses(),
    getAppOverviewStats(),
    Promise.resolve(getSetupState())
  ]);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.04fr_0.96fr]">
        <div className="glass-panel rounded-[2.4rem] p-6 sm:p-8">
          <p className="section-label">National leaderboard</p>
          <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)] sm:text-[4.7rem]">
            Ranked by golfers who actually order every course they’ve played.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            Drag your own played-course stack into shape. We convert those ordered lists into pairwise signals and roll them into one evolving crowd board for public golf.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={viewer.user ? (viewer.profile?.onboarding_completed ? "/my-courses" : "/onboarding") : "/sign-in?next=/my-courses"}
              className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white"
            >
              {viewer.user ? "Rank my courses" : "Start ranking"}
            </Link>
            <Link
              href="/friends"
              className="rounded-full border border-[rgba(24,37,43,0.08)] bg-white/85 px-5 py-3 text-sm font-semibold text-[var(--ink)]"
            >
              Explore friends
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {[
            { label: "Seeded public courses", value: stats.courseCount },
            { label: "Golfers onboarded", value: stats.golferCount },
            { label: "Pairwise signals", value: stats.signalCount }
          ].map((item) => (
            <div key={item.label} className="glass-panel rounded-[2rem] p-5">
              <p className="text-sm text-[var(--muted)]">{item.label}</p>
              <p className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--ink)]">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {!setup.configured ? (
        <section className="glass-panel rounded-[2rem] p-6">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Backend setup still needed</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Configure Supabase credentials before the leaderboard can read live data.
          </p>
          <ul className="mt-4 list-disc pl-5 text-sm text-[var(--muted)]">
            {setup.missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="glass-panel rounded-[2.2rem] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-label">Live board</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
              Crowd-ranked public courses
            </h2>
          </div>
          <div className="rounded-full border border-[rgba(24,37,43,0.08)] bg-white/85 px-4 py-2 text-sm font-medium text-[var(--muted)]">
            Thresholded by golfers + signals
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="mt-6 rounded-[1.8rem] border border-dashed border-[rgba(24,37,43,0.12)] px-5 py-10 text-sm leading-6 text-[var(--muted)]">
            No course has cleared the leaderboard threshold yet. Add played courses, drag them into order, and the national board will fill itself in as signals accumulate.
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-[1.7rem] border border-[rgba(24,37,43,0.08)]">
            <div className="hidden grid-cols-[90px_1.8fr_0.95fr_0.75fr_0.7fr] gap-4 bg-[rgba(255,255,255,0.7)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)] md:grid">
              <div>Rank</div>
              <div>Course</div>
              <div>Score</div>
              <div>Sample</div>
              <div>Price</div>
            </div>
            <div className="divide-y divide-[rgba(24,37,43,0.08)]">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="grid gap-3 bg-white/88 px-5 py-4 transition hover:bg-white md:grid-cols-[90px_1.8fr_0.95fr_0.75fr_0.7fr] md:items-center"
                >
                  <div className="text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
                    #{course.leaderboardRank}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{course.name}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                  </div>
                  <div>
                    <div className="inline-flex rounded-full bg-[var(--pine-soft)] px-3 py-2 text-sm font-semibold text-[var(--pine)]">
                      {course.normalizedScore.toFixed(1)}
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                      {course.wins}W / {course.losses}L
                    </p>
                  </div>
                  <div className="text-sm text-[var(--muted)]">
                    {course.numUniqueGolfers} golfers
                    <br />
                    {course.numSignals} signals
                  </div>
                  <div className="text-sm text-[var(--muted)]">{getPriceBandLabel(course.price_band)}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
