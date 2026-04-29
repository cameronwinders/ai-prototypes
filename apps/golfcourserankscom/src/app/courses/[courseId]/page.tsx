import Link from "next/link";
import { notFound } from "next/navigation";

import { CourseDetailActions } from "@/components/CourseDetailActions";
import { NoteEditor } from "@/components/NoteEditor";
import { getCourseDetail } from "@/lib/data";
import { formatLocation, getPriceBandLabel, pluralize } from "@/lib/ranking";
import { getViewerContext } from "@/lib/viewer";

export default async function CourseDetailPage({
  params
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const viewer = await getViewerContext();
  const detail = await getCourseDetail(courseId, viewer.user?.id ?? null, viewer.profile?.handicap_band ?? null);

  if (!detail) {
    notFound();
  }

  const { course, aggregate, aiSummary, viewerPlayed } = detail;

  return (
    <div className="space-y-6">
      <section className="shell-panel rounded-[2.4rem] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--pine-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--pine)]">
                Seed #{course.seed_rank}
              </span>
              {aggregate?.is_early ?? true ? (
                <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Early / seeded ranking
                </span>
              ) : null}
            </div>
            <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
              {course.name}
            </h1>
            <p className="mt-3 text-lg text-[var(--muted)]">{formatLocation(course)}</p>
          </div>
          <div className="rounded-[1.6rem] bg-[var(--ink)] px-5 py-4 text-white">
            <p className="text-xs uppercase tracking-[0.18em] text-white/70">National rank</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
              #{aggregate?.rank ?? course.seed_rank}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            { label: "Crowd score", value: aggregate ? aggregate.normalized_score.toFixed(1) : "0.0" },
            { label: "Golfers", value: aggregate ? pluralize(aggregate.num_unique_golfers, "golfer") : "0 golfers" },
            { label: "Comparisons", value: aggregate ? pluralize(aggregate.num_signals, "comparison") : "0 comparisons" },
            { label: "Price band", value: getPriceBandLabel(course.price_band) }
          ].map((item) => (
            <div key={item.label} className="rounded-[1.7rem] border border-[var(--line)] bg-white/88 p-4">
              <p className="text-sm text-[var(--muted)]">{item.label}</p>
              <p className="mt-3 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <section className="shell-panel rounded-[2rem] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-label">AI summary</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                  What real golfers love and complain about
                </h2>
              </div>
              <Link
                href={`/feedback?screen=${encodeURIComponent("Course detail")}&from=${encodeURIComponent(`/courses/${course.id}`)}`}
                className="ghost-button min-h-11"
              >
                Flag summary
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.6rem] border border-[var(--line)] bg-white/90 p-5">
                <p className="section-label">Loved</p>
                <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-6 text-[var(--muted)]">
                  {aiSummary.loves.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[1.6rem] border border-[var(--line)] bg-white/90 p-5">
                <p className="section-label">Complaints</p>
                <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-6 text-[var(--muted)]">
                  {aiSummary.complaints.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-[var(--line)] bg-[rgba(255,255,255,0.86)] px-4 py-4 text-sm leading-6 text-[var(--muted)]">
              {aiSummary.disclaimer}
            </div>

            {aiSummary.fit ? (
              <details className="mt-4 rounded-[1.5rem] border border-[var(--line)] bg-white/88 p-5">
                <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.16em] text-[var(--pine)]">
                  Why this may fit your handicap band
                </summary>
                <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{aiSummary.fit}</p>
              </details>
            ) : null}
          </section>

          {viewer.user ? <NoteEditor courseId={course.id} initialNote={viewerPlayed?.note ?? ""} /> : null}
        </div>

        <aside className="space-y-6">
          <section className="shell-panel rounded-[2rem] p-6">
            <p className="section-label">Your actions</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
              Bring this round into your list.
            </h2>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              Marking a course as played adds it to your private course log. Ranking it later turns that personal opinion into usable leaderboard signal.
            </p>
            <div className="mt-6">
              <CourseDetailActions
                courseId={course.id}
                initialPlayed={viewerPlayed}
                viewerSignedIn={Boolean(viewer.user)}
                viewerNeedsOnboarding={Boolean(viewer.user && !viewer.profile?.onboarding_completed)}
              />
            </div>
          </section>

          <section className="shell-panel rounded-[2rem] p-6">
            <p className="section-label">Metadata</p>
            <div className="mt-4 grid gap-3">
              {[
                { label: "Par", value: course.par ?? "—" },
                { label: "Slope", value: course.slope ?? "—" },
                { label: "USGA rating", value: course.rating ?? "—" },
                { label: "Seed source", value: course.seed_source?.lists?.join(", ") ?? "Curated public rankings" }
              ].map((item) => (
                <div key={item.label} className="rounded-[1.5rem] bg-white/86 px-4 py-4">
                  <p className="text-sm text-[var(--muted)]">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-[var(--ink)]">{item.value}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
