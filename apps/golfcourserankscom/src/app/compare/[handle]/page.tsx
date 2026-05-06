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
      <section className="shell-panel p-6 sm:p-8">
        <p className="eyebrow">COMPARE</p>
        <h1 className="h2 mt-4">Your ranking list vs {overview.friend.display_name ?? overview.friend.handle}</h1>
        <p className="subhed mt-4">
          This view only shows courses both of you have ranked.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="shell-panel p-6">
          <p className="eyebrow">SHARED COURSES</p>
          <h2 className="h3 mt-4">Same courses, different order</h2>

          {overview.overlap.length === 0 ? (
            <div className="mt-6 rounded-[var(--radius-lg)] border border-dashed border-[var(--line)] px-5 py-8 text-sm leading-7 text-[var(--muted)]">
              No overlap yet. Once both of you rank some of the same courses, this table will turn into the real taste test.
            </div>
          ) : (
            <div className="mt-6 grid gap-3">
              {overview.overlap.map((course) => (
                <div key={course.id} className="rounded-[var(--radius-md)] border border-[var(--line)] bg-white/92 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="h3 text-[1.35rem]">{course.name}</h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                    </div>
                    <Link href={`/courses/${course.id}`} className="ghost-button sm">
                      Course detail
                    </Link>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[var(--radius-md)] bg-[rgba(245,238,228,0.94)] px-4 py-3 text-sm text-[var(--muted)]">
                      Your rank
                      <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">#{course.selfRank}</p>
                    </div>
                    <div className="rounded-[var(--radius-md)] bg-[rgba(216,231,221,0.92)] px-4 py-3 text-sm text-[var(--muted)]">
                      Friend rank
                      <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">#{course.friendRank}</p>
                    </div>
                    <div className="rounded-[var(--radius-md)] bg-white px-4 py-3 text-sm text-[var(--muted)]">
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
          <section className="shell-panel-soft p-6">
            <p className="eyebrow">COVERAGE</p>
            <div className="mt-4 grid gap-3">
              {[
                { label: "Shared ranked courses", value: overview.overlap.length },
                { label: "Only on your ranked list", value: overview.selfOnlyCount },
                { label: "Only on their ranked list", value: overview.friendOnlyCount }
              ].map((item) => (
                <div key={item.label} className="shell-panel-contrast p-4">
                  <p className="meta">{item.label}</p>
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
