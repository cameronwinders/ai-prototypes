import Link from "next/link";
import { notFound } from "next/navigation";

import { getCompareOverview } from "@/lib/data";
import { formatLocation } from "@/lib/ranking";
import { requireOnboardedViewer } from "@/lib/viewer";

export default async function ComparePage({
  params
}: {
  params: Promise<{ handle: string }>;
}) {
  const viewer = await requireOnboardedViewer("/friends");
  const { handle } = await params;
  const overview = await getCompareOverview(viewer.user!.id, handle);

  if (!overview) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="shell-panel rounded-[2.3rem] p-6 sm:p-8">
        <p className="section-label">Compare</p>
        <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
          Your ranking stack vs {overview.friend.display_name ?? overview.friend.handle}
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">
          This view only shows courses both of you have ranked. It is intentionally overlap-only so the compare stays useful without overexposing private course history.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="shell-panel rounded-[2rem] p-6">
          <p className="section-label">Shared courses</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
            Same courses, different order
          </h2>

          {overview.overlap.length === 0 ? (
            <div className="mt-6 rounded-[1.6rem] border border-dashed border-[var(--line)] px-5 py-8 text-sm leading-6 text-[var(--muted)]">
              No overlap yet. Once both of you rank some of the same courses, this table will turn into the real taste test.
            </div>
          ) : (
            <div className="mt-6 grid gap-3">
              {overview.overlap.map((course) => (
                <div key={course.id} className="rounded-[1.7rem] border border-[var(--line)] bg-white/92 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">{course.name}</h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                    </div>
                    <Link href={`/courses/${course.id}`} className="ghost-button min-h-11">
                      Course detail
                    </Link>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.4rem] bg-[rgba(245,238,228,0.94)] px-4 py-3 text-sm text-[var(--muted)]">
                      Your rank
                      <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">#{course.selfRank}</p>
                    </div>
                    <div className="rounded-[1.4rem] bg-[rgba(216,231,221,0.92)] px-4 py-3 text-sm text-[var(--muted)]">
                      Friend rank
                      <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">#{course.friendRank}</p>
                    </div>
                    <div className="rounded-[1.4rem] bg-white px-4 py-3 text-sm text-[var(--muted)]">
                      Difference
                      <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                        {course.delta === 0 ? "Match" : `${Math.abs(course.delta)} slot${Math.abs(course.delta) === 1 ? "" : "s"}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <section className="shell-panel rounded-[2rem] p-6">
            <p className="section-label">Coverage</p>
            <div className="mt-4 grid gap-3">
              {[
                { label: "Shared ranked courses", value: overview.overlap.length },
                { label: "Only on your ranked list", value: overview.selfOnlyCount },
                { label: "Only on their ranked list", value: overview.friendOnlyCount }
              ].map((item) => (
                <div key={item.label} className="rounded-[1.5rem] bg-white/86 px-4 py-4">
                  <p className="text-sm text-[var(--muted)]">{item.label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{item.value}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
