import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CourseDetailActions } from "@/components/CourseDetailActions";
import { CoursePreviewPanel } from "@/components/CoursePreviewPanel";
import { NoteEditor } from "@/components/NoteEditor";
import { ShareButton } from "@/components/ShareButton";
import { getCourseDetail } from "@/lib/data";
import { EDITORIAL_LISTS, type CourseRecord } from "@/lib/types";
import { formatCrowdScore, formatLocation, pluralize } from "@/lib/ranking";
import { getSiteUrl } from "@/lib/supabase/env";
import { getViewerContext } from "@/lib/viewer";

function formatEditorialPosition(position?: number) {
  return position ? `#${position}` : "\u2014";
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
      title: "Course not found"
    };
  }

  const score = detail.aggregate?.normalized_score?.toFixed(1) ?? "0.0";
  const title = detail.course.name;
  const description = `${formatLocation(detail.course)} - Crowd score ${score} on Golf Course Ranks.`;
  const url = `${getSiteUrl()}/courses/${detail.course.id}`;
  const image = `${url}/opengraph-image`;

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

  const { course, aggregate, aiSummary, viewerPlayed } = detail;
  const courseUrl = `/courses/${course.id}`;
  const siteUrl = getSiteUrl();
  const isEditorialOnly = (aggregate?.num_unique_golfers ?? 0) === 0;
  const crowdRank = aggregate?.rank ?? course.seed_rank;
  const crowdScore = aggregate ? formatCrowdScore(aggregate.normalized_score) : "0.0";
  const golfersCount = aggregate?.num_unique_golfers ?? 0;
  const editorialLine = buildEditorialLine(course);
  const summaryLine = aiSummary.fit ?? aiSummary.loves[0] ?? "Golfers keep this one in the conversation for a reason.";

  return (
    <div className="space-y-6">
      <Link
        href="/rankings"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted transition-colors hover:text-ink"
      >
        <span aria-hidden="true">{"←"}</span> Back to rankings
      </Link>
      <section className="shell-panel shell-panel-contrast p-6 sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="pill pill-pine">Rank #{crowdRank}</span>
                <h1 className="h1 mt-3 text-ink">{course.name}</h1>
                <p className="mt-3 text-base text-muted sm:text-lg">{formatLocation(course)}</p>
              </div>
              <ShareButton
                title={`${course.name} | Golf Course Ranks`}
                text={`Take a look at ${course.name} on Golf Course Ranks.`}
                url={`${siteUrl}${courseUrl}?utm_source=share&utm_medium=course&utm_campaign=course_share`}
                className="ghost-button sm min-h-11"
                analyticsSurface="course-detail"
                buttonChildren="Share course"
                hideStatus
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-semibold text-ink">
              <span>#{crowdRank}</span>
              <span aria-hidden="true" className="text-muted">
                |
              </span>
              <span title="Crowd score = how golfers actually rank it.">
                {isEditorialOnly ? "Starting score" : "Crowd score"} {crowdScore}
              </span>
              <span aria-hidden="true" className="text-muted">
                |
              </span>
              <span>{pluralize(golfersCount, "golfer")}</span>
            </div>

            <p className="meta mt-3">Editorial: {editorialLine}</p>
            <p className="subhed mt-5 max-w-3xl">{summaryLine}</p>

            <div className="mt-6 max-w-sm">
              <CourseDetailActions
                courseId={course.id}
                initialPlayed={viewerPlayed}
                initialWishlisted={detail.viewerWishlisted}
                viewerSignedIn={Boolean(viewer.user)}
                viewerNeedsOnboarding={Boolean(viewer.user && !viewer.profile?.onboarding_completed)}
              />
            </div>
          </div>

          <CoursePreviewPanel
            courses={[
              {
                id: course.id,
                name: course.name,
                city: course.city,
                state: course.state,
                leaderboardRank: crowdRank,
                normalizedScore: aggregate?.normalized_score ?? 0,
                editorialRanks: course.editorialRanks
              }
            ]}
            eyebrow="Course preview"
            badgeLabel="Course card"
            heroTagLabel={isEditorialOnly ? "Starting score" : "Crowd favorite"}
            scoreEyebrow={isEditorialOnly ? "Starting score" : "Crowd score"}
            showRest={false}
          />
        </div>
      </section>

      <section className="shell-panel shell-panel-soft p-6">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h2 className="h2 text-[1.85rem] text-ink">What golfers notice</h2>
            <div className="mt-4 grid gap-3">
              {aiSummary.loves.length > 0 ? (
                aiSummary.loves.slice(0, 3).map((item) => (
                  <div key={item} className="rounded-md border border-line bg-white/88 px-4 py-4 text-sm leading-6 text-ink">
                    {item}
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-line bg-white/88 px-4 py-4 text-sm leading-6 text-muted">
                  Notes will sharpen as more golfers rank and write about this course.
                </div>
              )}
            </div>
            {aiSummary.disclaimer ? <p className="meta mt-4">{aiSummary.disclaimer}</p> : null}
          </div>

          <div>
            <h2 className="h2 text-[1.85rem] text-ink">Course information</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {[
                { label: "Par", value: course.par ?? "\u2014" },
                { label: "Slope", value: course.slope ?? "\u2014" },
                { label: "USGA rating", value: course.rating ?? "\u2014" }
              ].map((item) => (
                <div key={item.label} className="rounded-md border border-line bg-white/88 px-4 py-4">
                  <p className="meta">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-ink">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {viewer.user ? (
        <section className="shell-panel p-6">
          <h2 className="h2 text-[1.5rem] text-ink">Private note</h2>
          <div className="mt-4">
            <NoteEditor courseId={course.id} initialNote={viewerPlayed?.note ?? ""} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
