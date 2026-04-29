import Link from "next/link";
import { notFound } from "next/navigation";

import { getComparisonOverview } from "@/lib/data";
import { formatLocation } from "@/lib/ranking";
import { requireOnboardedViewer } from "@/lib/viewer";

export default async function ComparePage({
  params
}: {
  params: Promise<{ handle: string }>;
}) {
  const viewer = await requireOnboardedViewer("/compare");
  const { handle } = await params;
  const overview = await getComparisonOverview(viewer.user!.id, handle);

  if (!overview) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[2.3rem] p-6 sm:p-8">
        <p className="section-label">Comparison</p>
        <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
          Your board vs @{overview.otherProfile.handle}
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">
          See where your taste overlaps, where you diverge, and which favorites the other golfer is surfacing that have not made your own list yet.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="glass-panel rounded-[2rem] p-6">
          <p className="section-label">Shared courses</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
            Same courses, different placements
          </h2>

          {overview.comparison.overlap.length === 0 ? (
            <div className="mt-6 rounded-[1.6rem] border border-dashed border-[rgba(24,37,43,0.12)] px-5 py-8 text-sm leading-6 text-[var(--muted)]">
              No overlap yet. As both lists grow, this section will turn into the real taste test.
            </div>
          ) : (
            <div className="mt-6 grid gap-3">
              {overview.comparison.overlap.map((course) => (
                <div key={course.id} className="rounded-[1.7rem] border border-[rgba(24,37,43,0.08)] bg-white/90 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">{course.name}</h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">{course.city}, {course.state}</p>
                    </div>
                    <Link
                      href={`/courses/${course.id}`}
                      className="rounded-full border border-[rgba(24,37,43,0.08)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
                    >
                      Open course
                    </Link>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.4rem] bg-[rgba(245,238,228,0.9)] px-4 py-3 text-sm text-[var(--muted)]">
                      Your rank
                      <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">#{course.selfRank}</p>
                    </div>
                    <div className="rounded-[1.4rem] bg-[rgba(220,234,230,0.84)] px-4 py-3 text-sm text-[var(--muted)]">
                      Their rank
                      <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">#{course.otherRank}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <section className="glass-panel rounded-[2rem] p-6">
            <p className="section-label">Only on your list</p>
            <div className="mt-4 grid gap-3">
              {overview.comparison.selfOnly.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">You do not have any unique picks yet.</p>
              ) : (
                overview.comparison.selfOnly.map((course) => (
                  <div key={course.id} className="rounded-[1.5rem] border border-[rgba(24,37,43,0.08)] bg-white/90 p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--pine)]">#{course.rankIndex + 1}</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--ink)]">{course.name}</p>
                    <p className="text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="glass-panel rounded-[2rem] p-6">
            <p className="section-label">Only on their list</p>
            <div className="mt-4 grid gap-3">
              {overview.comparison.otherOnly.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">They do not have any unique picks yet.</p>
              ) : (
                overview.comparison.otherOnly.map((course) => (
                  <div key={course.id} className="rounded-[1.5rem] border border-[rgba(24,37,43,0.08)] bg-white/90 p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--pine)]">#{course.rankIndex + 1}</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--ink)]">{course.name}</p>
                    <p className="text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
