import Link from "next/link";
import { notFound } from "next/navigation";

import { getCourseDetail } from "@/lib/data";
import { formatLocation, getPriceBandLabel } from "@/lib/ranking";
import { getViewerContext } from "@/lib/viewer";

export default async function CourseDetailPage({
  params
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const viewer = await getViewerContext();
  const detail = await getCourseDetail(courseId, viewer.profile?.handicap_band ?? null);

  if (!detail) {
    notFound();
  }

  const { course, rating, aiStory } = detail;

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[2.4rem] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-label">Course detail</p>
            <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
              {course.name}
            </h1>
            <p className="mt-3 text-lg text-[var(--muted)]">{formatLocation(course)}</p>
          </div>
          <div className="rounded-[1.6rem] bg-[var(--ink)] px-5 py-4 text-white">
            <p className="text-xs uppercase tracking-[0.18em] text-white/70">National rank</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
              {rating?.rank ? `#${rating.rank}` : "Pending"}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            { label: "Crowd score", value: rating ? rating.normalized_score.toFixed(1) : "0.0" },
            { label: "Sample size", value: rating ? `${rating.num_unique_golfers} golfers` : "No signals" },
            { label: "Slope / rating", value: `${course.slope ?? "—"} / ${course.rating ?? "—"}` },
            { label: "Price band", value: getPriceBandLabel(course.price_band) }
          ].map((item) => (
            <div key={item.label} className="rounded-[1.7rem] border border-[rgba(24,37,43,0.08)] bg-white/88 p-4">
              <p className="text-sm text-[var(--muted)]">{item.label}</p>
              <p className="mt-3 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="glass-panel rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-label">AI readout</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                What real golfers love and complain about
              </h2>
            </div>
            <Link
              href={`/feedback?screen=${encodeURIComponent("Course detail")}&from=${encodeURIComponent(`/courses/${course.id}`)}`}
              className="rounded-full border border-[rgba(24,37,43,0.08)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--ink)]"
            >
              Flag this summary
            </Link>
          </div>

          {!aiStory ? (
            <div className="mt-6 rounded-[1.6rem] border border-dashed border-[rgba(24,37,43,0.12)] px-5 py-8 text-sm leading-6 text-[var(--muted)]">
              We do not have enough crowd signal yet to generate a credible summary for this course.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.6rem] border border-[rgba(24,37,43,0.08)] bg-white/90 p-5">
                <p className="section-label">Golfers love</p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
                  {aiStory.loves.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[1.6rem] border border-[rgba(24,37,43,0.08)] bg-white/90 p-5">
                <p className="section-label">Golfers complain</p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
                  {aiStory.complaints.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {aiStory?.fit ? (
            <details className="mt-5 rounded-[1.6rem] border border-[rgba(24,37,43,0.08)] bg-white/88 p-5">
              <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.16em] text-[var(--pine)]">
                Why this may fit your handicap band
              </summary>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{aiStory.fit}</p>
            </details>
          ) : null}
        </div>

        <div className="glass-panel rounded-[2rem] p-6">
          <p className="section-label">Quick actions</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
            Bring this course into your list.
          </h2>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            The leaderboard only gets smarter when more golfers rank what they have actually played.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={viewer.user ? "/my-courses" : "/sign-in?next=/my-courses"}
              className="rounded-full bg-[var(--ink)] px-5 py-3 text-center text-sm font-semibold text-white"
            >
              {viewer.user ? "Add from My Courses" : "Sign in to rank it"}
            </Link>
            <Link
              href={`/feedback?screen=${encodeURIComponent("Course detail")}&from=${encodeURIComponent(`/courses/${course.id}`)}`}
              className="rounded-full border border-[rgba(24,37,43,0.08)] bg-white/85 px-5 py-3 text-center text-sm font-semibold text-[var(--ink)]"
            >
              Send feedback on this page
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
