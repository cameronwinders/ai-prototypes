"use client";

import { useMemo, useState } from "react";

import { submitFeedback } from "@/app/actions";
import { FEEDBACK_TYPES } from "@/lib/types";

type FeedbackFormProps = {
  initialScreenName: string;
  initialUrl: string;
  initialFeedbackType?: (typeof FEEDBACK_TYPES)[number];
};

function makeSubmissionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `feedback-${Date.now()}`;
}

const FEEDBACK_LABELS: Record<(typeof FEEDBACK_TYPES)[number], string> = {
  bug: "Bug",
  feature: "Feature request",
  general: "General feedback",
  "course-addition": "Course addition"
};

const PLACEHOLDERS: Record<(typeof FEEDBACK_TYPES)[number], string> = {
  bug: "Tell us what went wrong and where you saw it.",
  feature: "Describe the feature or improvement you want to see.",
  general: "Tell us what felt great, confusing, or worth improving.",
  "course-addition": "Which course should be added, and why does it belong on Golf Course Ranks?"
};

export function FeedbackForm({ initialScreenName, initialUrl, initialFeedbackType = "feature" }: FeedbackFormProps) {
  const [feedbackType, setFeedbackType] = useState<(typeof FEEDBACK_TYPES)[number]>(initialFeedbackType);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [clientSubmissionId, setClientSubmissionId] = useState(makeSubmissionId);
  const screenName = useMemo(() => initialScreenName || "App", [initialScreenName]);
  const currentUrl = useMemo(() => initialUrl || "/feedback", [initialUrl]);

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();

        if (pending) {
          return;
        }

        setPending(true);
        setStatus(null);

        const result = await submitFeedback({
          feedbackType,
          message,
          screenName,
          currentUrl,
          userAgent: typeof navigator === "undefined" ? "unknown" : navigator.userAgent,
          clientSubmissionId
        });

        setPending(false);
        setStatus(result.message ?? (result.ok ? "Feedback sent." : "Something went wrong."));

        if (result.ok) {
          setMessage("");
          setClientSubmissionId(makeSubmissionId());
        }
      }}
    >
      <div className="flex flex-wrap gap-2">
        {FEEDBACK_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFeedbackType(type)}
            className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
              feedbackType === type
                ? "bg-[var(--ink)] text-white"
                : "border border-[var(--line)] bg-white text-[var(--muted)]"
            }`}
          >
            {FEEDBACK_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="rounded-[1.5rem] border border-[var(--line)] bg-[rgba(255,255,255,0.88)] p-4 text-sm text-[var(--muted)]">
        <p>
          Captured screen: <span className="font-semibold text-[var(--ink)]">{screenName}</span>
        </p>
        <p className="mt-1 break-all">
          Captured URL: <span className="font-semibold text-[var(--ink)]">{currentUrl}</span>
        </p>
      </div>

      <label className="block text-sm font-semibold text-[var(--ink)]">
        What should we know?
        <textarea
          required
          minLength={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={6}
          placeholder={PLACEHOLDERS[feedbackType]}
          className="mt-2 w-full rounded-[1.5rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[rgba(49,107,83,0.45)]"
        />
      </label>

      {status ? <p className="text-sm text-[var(--muted)]">{status}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
      >
        {pending ? "Sending..." : "Send feedback"}
      </button>
    </form>
  );
}
