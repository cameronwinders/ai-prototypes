import Link from "next/link";

import { FeedbackForm } from "@/components/FeedbackForm";
import { FEEDBACK_TYPES } from "@/lib/types";

export default async function FeedbackPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const screenParam = params.screen;
  const fromParam = params.from;
  const topicParam = params.topic;
  const screenName = Array.isArray(screenParam) ? screenParam[0] : screenParam ?? "App";
  const currentUrl = Array.isArray(fromParam) ? fromParam[0] : fromParam ?? "/feedback";
  const topic = Array.isArray(topicParam) ? topicParam[0] : topicParam ?? "feature";
  const initialFeedbackType = FEEDBACK_TYPES.includes(topic as (typeof FEEDBACK_TYPES)[number])
    ? (topic as (typeof FEEDBACK_TYPES)[number])
    : "feature";

  return (
    <div className="space-y-6">
      <section className="shell-panel rounded-[2.3rem] p-6 sm:p-8">
        <p className="section-label">Feedback</p>
        <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
          Tell us what to improve.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">
          Share bugs, feature ideas, or request a course addition. We attach the current screen and URL automatically so your note arrives with context.
        </p>
        <div className="mt-6">
          <Link
            href={`/feedback?screen=${encodeURIComponent(screenName)}&from=${encodeURIComponent(currentUrl)}&topic=course-addition`}
            className="ghost-button min-h-11"
          >
            Request a course addition
          </Link>
        </div>
      </section>

      <section className="shell-panel rounded-[2rem] p-6 sm:p-7">
        <FeedbackForm initialScreenName={screenName} initialUrl={currentUrl} initialFeedbackType={initialFeedbackType} />
      </section>
    </div>
  );
}
