import Link from "next/link";

import { getAppOverviewStats, getLeaderboardCourses } from "@/lib/data";
import { formatLocation, getPriceBandLabel, pluralize } from "@/lib/ranking";
import { HANDICAP_OPTIONS } from "@/lib/types";

export default async function LeaderboardPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const bandParam = Array.isArray(params.band) ? params.band[0] : params.band;
  const minSignalsParam = Array.isArray(params.minSignals) ? params.minSignals[0] : params.minSignals;
  const band = HANDICAP_OPTIONS.includes(bandParam as (typeof HANDICAP_OPTIONS)[number])
    ? (bandParam as (typeof HANDICAP_OPTIONS)[number])
    : null;
  const minSignals = Number.isFinite(Number(minSignalsParam)) ? Math.max(0, Number(minSignalsParam)) : 0;

  const [stats, courses] = await Promise.all([
    getAppOverviewStats(),
    getLeaderboardCourses({
      handicapBand: band,
      minSignals,
      limit: 200
    })
  ]);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="shell-panel rounded-[2.4rem] p-6 sm:p-8">
          <p className="section-label">National leaderboard</p>
          <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)] sm:text-[5rem]">
            Public courses ranked by comparative lists, not star ratings.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--muted)]">
            Every golfer contributes one ordered stack. We infer head-to-head outcomes from those lists, blend them with a seeded baseline during cold start, and keep the trust cues visible while the board matures.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full bg-[var(--pine-soft)] px-4 py-2 text-sm font-semibold text-[var(--pine)]">
              {pluralize(stats.golferCount, "golfer")}
            </span>
            <span className="rounded-full border border-[var(--line)] bg-white/85 px-4 py-2 text-sm font-semibold text-[var(--muted)]">
              {pluralize(stats.signalCount, "comparison")}
            </span>
            <span className="rounded-full border border-[var(--line)] bg-white/85 px-4 py-2 text-sm font-semibold text-[var(--muted)]">
              Seeded baseline visible while early
            </span>
          </div>
        </div>

        <section className="shell-panel rounded-[2rem] p-6">
          <form className="grid gap-4" action="/leaderboard">
            <div>
              <label className="text-sm font-semibold text-[var(--ink)]">Handicap band</label>
              <select
                name="band"
                defaultValue={band ?? ""}
                className="mt-2 min-h-11 w-full rounded-[1.2rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="">All golfers</option>
                {HANDICAP_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-[var(--ink)]">Minimum comparisons</label>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                name="minSignals"
                defaultValue={String(minSignals)}
                className="mt-3 w-full"
              />
              <p className="mt-2 text-sm text-[var(--muted)]">Currently showing courses with at least {minSignals} comparisons.</p>
            </div>
            <button type="submit" className="solid-button min-h-11 justify-center">
              Apply filters
            </button>
          </form>
        </section>
      </section>

      <section className="shell-panel rounded-[2rem] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-label">Live board</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
              Crowd-ranked public courses
            </h2>
          </div>
          <Link href="/courses" className="ghost-button min-h-11">
            Add played courses
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="mt-6 rounded-[1.8rem] border border-dashed border-[var(--line)] px-5 py-10 text-sm leading-6 text-[var(--muted)]">
            No course clears the current comparison threshold for this filter. Lower the minimum comparisons or switch back to all golfers.
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-[1.8rem] border border-[var(--line)]">
            <div className="hidden grid-cols-[78px_1.6fr_1fr_0.8fr_0.8fr] gap-4 bg-[rgba(255,255,255,0.78)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)] md:grid">
              <div>Rank</div>
              <div>Course</div>
              <div>Trust cues</div>
              <div>Score</div>
              <div>Price</div>
            </div>
            <div className="divide-y divide-[var(--line)]">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="grid gap-3 bg-white/90 px-5 py-4 transition hover:bg-white md:grid-cols-[78px_1.6fr_1fr_0.8fr_0.8fr] md:items-center"
                >
                  <div className="text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">#{course.leaderboardRank}</div>
                  <div>
                    <h3 className="text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{course.name}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                  </div>
                  <div className="text-sm text-[var(--muted)]">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        {pluralize(course.numUniqueGolfers, "golfer")}
                      </span>
                      <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        {pluralize(course.numSignals, "comparison")}
                      </span>
                      {course.isEarly ? (
                        <span className="rounded-full bg-[var(--pine-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--pine)]">
                          Early / seeded
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <div className="inline-flex rounded-full bg-[var(--pine-soft)] px-3 py-2 text-sm font-semibold text-[var(--pine)]">
                      {course.normalizedScore.toFixed(1)}
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                      {course.wins}W / {course.losses}L
                    </p>
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
