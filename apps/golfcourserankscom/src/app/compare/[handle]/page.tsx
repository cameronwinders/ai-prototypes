import Link from "next/link";
import { notFound } from "next/navigation";

import { ShareButton } from "@/components/ShareButton";
import { getCompareOverview } from "@/lib/data";
import { formatLocation } from "@/lib/ranking";
import { getSiteUrl } from "@/lib/supabase/env";
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

  const friendName = overview.friend.display_name ?? overview.friend.handle;
  const sharedCount = overview.overlap.length;
  const exactMatches = overview.overlap.filter((course) => course.delta === 0).length;
  const biggestGap = [...overview.overlap]
    .filter((course) => course.delta !== 0)
    .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta) || left.selfRank - right.selfRank)[0] ?? null;
  const compareUrl = `${getSiteUrl()}/compare/${overview.friend.handle}`;

  return (
    <div className="space-y-6">
      <section className="shell-panel p-6 sm:p-8">
        <p className="eyebrow">COMPARE</p>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="h2">Your ranking list vs {friendName}</h1>
            <p className="subhed mt-4">This view only shows courses both of you have ranked.</p>
          </div>
          <ShareButton
            title={`Compare Golf Course Ranks lists: you vs ${friendName}`}
            text={`See where your public-course rankings match, and where ${friendName} sees the board differently.`}
            url={compareUrl}
            className="ghost-button"
            analyticsSurface="compare-page"
            buttonChildren="Share comparison"
          />
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="shell-panel-soft p-4">
            <p className="meta">Quick read</p>
            <p className="mt-3 text-sm leading-7 text-[var(--ink)]">
              {sharedCount === 0
                ? `You do not have any shared ranked courses with ${friendName} yet.`
                : biggestGap
                  ? `You and ${friendName} agree on ${exactMatches} of ${sharedCount} shared courses. Biggest gap: ${biggestGap.name} (you #${biggestGap.selfRank} vs ${friendName} #${biggestGap.friendRank}).`
                  : `You and ${friendName} agree on all ${sharedCount} shared ranked courses so far.`}
            </p>
          </div>
          <div className="shell-panel-contrast p-4">
            <p className="meta">What to do next</p>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Use the one-sided lists below to spot the courses one of you values that the other still has not ranked. That is usually the fastest path to the next golf text thread.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="shell-panel p-6">
          <p className="eyebrow">SHARED COURSES</p>
          <h2 className="h3">Same courses, different order</h2>

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

          <section className="shell-panel-contrast p-6">
            <p className="eyebrow">ONLY ON YOUR LIST</p>
            <h2 className="h3">Courses you ranked that {friendName} has not ranked yet</h2>
            {overview.selfOnly.length === 0 ? (
              <div className="mt-5 rounded-[var(--radius-md)] border border-dashed border-[var(--line)] px-4 py-6 text-sm leading-7 text-[var(--muted)]">
                Nothing exclusive on your side right now.
              </div>
            ) : (
              <div className="mt-5 grid gap-3">
                {overview.selfOnly.map((course) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="rounded-[var(--radius-md)] border border-[var(--line)] bg-white/90 px-4 py-4 transition hover:-translate-y-px hover:bg-white"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="h3 text-[1.05rem]">{course.name}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                      </div>
                      <span className="pill pill-line pill-sentence">Your #{course.rank}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="shell-panel-contrast p-6">
            <p className="eyebrow">ONLY ON THEIR LIST</p>
            <h2 className="h3">Courses {friendName} ranked that you have not ranked yet</h2>
            {overview.friendOnly.length === 0 ? (
              <div className="mt-5 rounded-[var(--radius-md)] border border-dashed border-[var(--line)] px-4 py-6 text-sm leading-7 text-[var(--muted)]">
                Nothing exclusive on {friendName}&apos;s side right now.
              </div>
            ) : (
              <div className="mt-5 grid gap-3">
                {overview.friendOnly.map((course) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="rounded-[var(--radius-md)] border border-[var(--line)] bg-white/90 px-4 py-4 transition hover:-translate-y-px hover:bg-white"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="h3 text-[1.05rem]">{course.name}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                      </div>
                      <span className="pill pill-pine pill-sentence">{friendName} #{course.rank}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </aside>
      </section>
    </div>
  );
}
