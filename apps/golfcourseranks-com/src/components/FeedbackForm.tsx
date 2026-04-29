"use client";

import { useMemo, useState } from "react";

import { submitFeedback } from "@/app/actions";
import { FEEDBACK_TYPES } from "@/lib/types";

type FeedbackFormProps = {
  initialScreenName: string;
  initialUrl: string;
};

export function FeedbackForm({ initialScreenName, initialUrl }: FeedbackFormProps) {
  const [feedbackType, setFeedbackType] = useState<(typeof FEEDBACK_TYPES)[number]>("feature");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const screenName = useMemo(() => initialScreenName || "App", [initialScreenName]);
  const currentUrl = useMemo(() => initialUrl || "/feedback", [initialUrl]);

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setStatus(null);

        const result = await submitFeedback({
          feedbackType,
          message,
          screenName,
          currentUrl,
          userAgent: typeof navigator === "undefined" ? "unknown" : navigator.userAgent
        });

        setPending(false);
        setStatus(result.message ?? (result.ok ? "Feedback sent." : "Something went wrong."));

        if (result.ok) {
          setMessage("");
        }
      }}
    >
      <div className="flex flex-wrap gap-2">
        {FEEDBACK_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFeedbackType(type)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
              feedbackType === type
                ? "bg-[var(--ink)] text-white"
                : "border border-[rgba(24,37,43,0.08)] bg-white text-[var(--muted)]"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="rounded-[1.5rem] border border-[rgba(24,37,43,0.08)] bg-white/92 p-4 text-sm text-[var(--muted)]">
        <p>Captured screen: <span className="font-semibold text-[var(--ink)]">{screenName}</span></p>
        <p className="mt-1 break-all">Captured URL: <span className="font-semibold text-[var(--ink)]">{currentUrl}</span></p>
      </div>

      <label className="block text-sm font-semibold text-[var(--ink)]">
        What should we know?
        <textarea
          required
          minLength={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={6}
          placeholder="Describe the bug, idea, or rough edge you hit."
          className="mt-2 w-full rounded-[1.5rem] border border-[rgba(24,37,43,0.08)] bg-white px-4 py-3 text-sm outline-none focus:border-[rgba(11,89,69,0.4)]"
        />
      </label>

      {status ? <p className="text-sm text-[var(--muted)]">{status}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
      >
        {pending ? "Sending..." : "Send feedback"}
      </button>
    </form>
  );
}
