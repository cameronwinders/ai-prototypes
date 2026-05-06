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
      <section className="shell-panel p-6 sm:p-8">
        <p className="eyebrow">FEEDBACK</p>
        <h1 className="h2 mt-4">Tell us what to improve</h1>
        <p className="subhed mt-4">
          Share bugs, feature ideas, or request a course addition with the current page attached.
        </p>
        <div className="mt-6">
          <Link
            href={`/feedback?screen=${encodeURIComponent(screenName)}&from=${encodeURIComponent(currentUrl)}&topic=course-addition`}
            className="ghost-button"
          >
            Request a course addition
          </Link>
        </div>
      </section>

      <section className="shell-panel-contrast p-6 sm:p-7">
        <FeedbackForm initialScreenName={screenName} initialUrl={currentUrl} initialFeedbackType={initialFeedbackType} />
      </section>
    </div>
  );
}
