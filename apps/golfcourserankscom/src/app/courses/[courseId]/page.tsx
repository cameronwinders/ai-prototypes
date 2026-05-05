import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CourseDetailActions } from "@/components/CourseDetailActions";
import { NoteEditor } from "@/components/NoteEditor";
import { ShareButton } from "@/components/ShareButton";
import { getCourseDetail } from "@/lib/data";
import { EDITORIAL_LISTS, type CourseRecord } from "@/lib/types";
import { formatLocation, pluralize } from "@/lib/ranking";
import { getSiteUrl } from "@/lib/supabase/env";
import { getViewerContext } from "@/lib/viewer";

function formatEditorialPosition(position?: number) {
  return position ? `#${position}` : "Not listed";
}

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
  const description = `${formatLocation(detail.course)} - Crowd score ${score} on Golf Course Ranks.`;
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

function buildEditorialLine(course: CourseRecord) {
  return EDITORIAL_LISTS.map((editorial) => `${editorial.label} ${formatEditorialPosition(course.editorialRanks?.[editorial.key])}`).join(" | ");
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
  const crowdRank = aggregate?.rank ?? course.seed_rank;
  const crowdScore = aggregate ? aggregate.normalized_score.toFixed(1) : "0.0";
  const golfersCount = aggregate?.num_unique_golfers ?? 0;
  const comparisonsCount = aggregate?.num_signals ?? 0;
  const editorialLine = buildEditorialLine(course);

  return (
    <div className="space-y-6">
      <section className="shell-panel shell-panel-contrast rounded-[2.4rem] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="brand-heading text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)]">{course.name}</h1>
                <p className="mt-3 text-lg text-[var(--muted)]">{formatLocation(course)}</p>
              </div>
              <ShareButton
                title={`${course.name} | Golf Course Ranks`}
                text={`Take a look at ${course.name} on Golf Course Ranks.`}
                url={`${siteUrl}${courseUrl}?utm_source=share&utm_medium=course&utm_campaign=course_share`}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[var(--line)] bg-white/88 text-[var(--ink)]"
                analyticsSurface="course-detail"
                hideSecondaryLinks
                hideStatus
                buttonChildren={
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none">
                    <path
                      d="M14.5 4.75h4.75V9.5m-9 9 9-9m-6.5-4.75H4.75v14.5h14.5v-8"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-semibold text-[var(--ink)]">
              <span>#{crowdRank}</span>
              <span aria-hidden="true" className="text-[var(--muted)]">|</span>
              <span title="Crowd score = how golfers actually rank it.">
                {isEditorialOnly ? "Starting score" : "Crowd score"} {crowdScore}
              </span>
              <span aria-hidden="true" className="text-[var(--muted)]">|</span>
              <span>{pluralize(golfersCount, "golfer")}</span>
              <span aria-hidden="true" className="text-[var(--muted)]">|</span>
              <span>{pluralize(comparisonsCount, "comparison")}</span>
            </div>

            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Editorial: {editorialLine}
            </p>
          </div>
        </div>

        <div className="mt-6 max-w-sm">
          <CourseDetailActions
            courseId={course.id}
            initialPlayed={viewerPlayed}
            viewerSignedIn={Boolean(viewer.user)}
            viewerNeedsOnboarding={Boolean(viewer.user && !viewer.profile?.onboarding_completed)}
          />
        </div>
      </section>

      <section className="shell-panel shell-panel-soft rounded-[2rem] p-6">
        <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Course Information</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Par", value: course.par ?? "-" },
            { label: "Slope", value: course.slope ?? "-" },
            { label: "USGA rating", value: course.rating ?? "-" }
          ].map((item) => (
            <div key={item.label} className="rounded-[1.5rem] bg-white/86 px-4 py-4">
              <p className="text-sm text-[var(--muted)]">{item.label}</p>
              <p className="mt-2 text-lg font-semibold text-[var(--ink)]">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {viewer.user ? (
        <section className="shell-panel rounded-[2rem] p-6">
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Private note</h2>
          <div className="mt-4">
            <NoteEditor courseId={course.id} initialNote={viewerPlayed?.note ?? ""} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
