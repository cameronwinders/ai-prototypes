import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CourseDetailActions } from "@/components/CourseDetailActions";
import { NoteEditor } from "@/components/NoteEditor";
import { ShareButton } from "@/components/ShareButton";
import { getCourseDetail } from "@/lib/data";
import { formatLocation, pluralize } from "@/lib/ranking";
import { getSiteUrl } from "@/lib/supabase/env";
import { getViewerContext } from "@/lib/viewer";

export async function generateMetadata({
  params
}: {
  params: Promise<{ courseId: string }>;
}): Promise<Metadata> {
  const { courseId } = await params;
  const detail = await getCourseDetail(courseId, null, null);

  if (!detail) {
    return {
      title: "Course not found | Golf Course Ranks"
    };
  }

  const score = detail.aggregate?.normalized_score?.toFixed(1) ?? "0.0";
  const title = `${detail.course.name} | Golf Course Ranks`;
  const description = `${formatLocation(detail.course)} · Crowd score ${score} on Golf Course Ranks.`;
  const url = `${getSiteUrl()}/courses/${detail.course.id}`;
  const image = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Pebble_Beach_18th_hole.jpg/1280px-Pebble_Beach_18th_hole.jpg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: [image]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image]
    }
  };
}

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

  const { course, aggregate, viewerPlayed } = detail;
  const courseUrl = `/courses/${course.id}`;
  const siteUrl = getSiteUrl();
  const isEditorialOnly = (aggregate?.num_unique_golfers ?? 0) === 0;
  const scoreLabel = isEditorialOnly ? "Starting score" : "Crowd score";
  const scoreContext = isEditorialOnly
    ? "This is the editorial starting point until more golfers add the course to their rankings."
    : "This score reflects where golfers currently keep the course on their personal lists.";

  return (
    <div className="space-y-6">
      <section className="shell-panel rounded-[2.4rem] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--pine-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--pine)]">
                Editorial starting rank #{course.seed_rank}
              </span>
              {aggregate?.is_early ?? true ? (
                <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Early leaderboard read
                </span>
              ) : null}
            </div>
            <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
              {course.name}
            </h1>
            <p className="mt-3 text-lg text-[var(--muted)]">{formatLocation(course)}</p>
          </div>
          <div className="rounded-[1.6rem] bg-[var(--ink)] px-5 py-4 text-[rgb(255,255,255)]">
            <p className="text-xs uppercase tracking-[0.18em] text-[rgba(255,255,255,0.7)]">National rank</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
              #{aggregate?.rank ?? course.seed_rank}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            { label: scoreLabel, value: aggregate ? aggregate.normalized_score.toFixed(1) : "0.0" },
            { label: "Golfers", value: aggregate ? pluralize(aggregate.num_unique_golfers, "golfer") : "0 golfers" },
            { label: "Comparisons", value: aggregate ? pluralize(aggregate.num_signals, "comparison") : "0 comparisons" },
            { label: "Editorial ranking source", value: course.seed_source?.lists?.join(", ") ?? "Curated public rankings" }
          ].map((item) => (
            <div key={item.label} className="rounded-[1.7rem] border border-[var(--line)] bg-white/88 p-4">
              <p className="text-sm text-[var(--muted)]">{item.label}</p>
              <p className="mt-3 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{item.value}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{scoreContext}</p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <section className="shell-panel rounded-[2rem] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-label">Your note</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                  Save what stood out while the round is still fresh.
                </h2>
              </div>
              <Link
                href={`/feedback?screen=${encodeURIComponent("Course detail")}&from=${encodeURIComponent(courseUrl)}&topic=course-addition`}
                className="ghost-button min-h-11"
              >
                Request a course
              </Link>
            </div>

            <div className="mt-5 rounded-[1.6rem] border border-[var(--line)] bg-white/88 p-5 text-sm leading-6 text-[var(--muted)]">
              Keep a private note on conditioning, pace, strategy, or whether this is a course you would happily book again.
            </div>

            {viewer.user ? (
              <div className="mt-6">
                <NoteEditor courseId={course.id} initialNote={viewerPlayed?.note ?? ""} />
              </div>
            ) : (
              <div className="mt-6 rounded-[1.6rem] border border-dashed border-[var(--line)] px-5 py-8 text-sm leading-6 text-[var(--muted)]">
                Sign in to save your own note, mark the course as played, and decide where it belongs in your personal ranking.
              </div>
            )}
          </section>

          <section className="shell-panel rounded-[2rem] p-6">
            <p className="section-label">What to know</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
              A clean read on where this course stands right now.
            </h2>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/88 px-4 py-4 text-sm leading-6 text-[var(--muted)]">
                {isEditorialOnly
                  ? "This page is still in its early stage. The national rank is being held by the editorial starting board until more golfers save and rank the course."
                  : "This page is already being shaped by real golfer rankings, so the national rank and score reflect active crowd signal."}
              </div>
              <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/88 px-4 py-4 text-sm leading-6 text-[var(--muted)]">
                Save the course to your list if you have played it, then rank it against your other rounds to help sharpen the national leaderboard and your friend comparisons.
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="shell-panel rounded-[2rem] p-6">
            <p className="section-label">Your actions</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
              Add this course to your ranking story.
            </h2>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              Marking a course as played keeps it on your personal list. Ranking it later helps shape the national board and your friend comparisons.
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
            <p className="section-label">Share</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
              Send this course page to a golf friend.
            </h2>
            <div className="mt-5 grid gap-3">
              <ShareButton
                title={`${course.name} | Golf Course Ranks`}
                text={`Take a look at ${course.name} on Golf Course Ranks.`}
                url={`${siteUrl}${courseUrl}?utm_source=share&utm_medium=course&utm_campaign=course_share`}
                className="solid-button min-h-11 justify-center"
                analyticsSurface="course-detail"
              />
              <Link href="/friends" className="ghost-button min-h-11 justify-center">
                Compare with friends
              </Link>
            </div>
          </section>

          <section className="shell-panel rounded-[2rem] p-6">
            <p className="section-label">Course Information</p>
            <div className="mt-4 grid gap-3">
              {[
                { label: "Par", value: course.par ?? "-" },
                { label: "Slope", value: course.slope ?? "-" },
                { label: "USGA rating", value: course.rating ?? "-" },
                { label: "Editorial ranking source", value: course.seed_source?.lists?.join(", ") ?? "Curated public rankings" }
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
