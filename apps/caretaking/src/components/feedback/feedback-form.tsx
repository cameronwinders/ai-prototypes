"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { submitFeedback } from "@/actions/feedback";
import { SubmitButton } from "@/components/ui/submit-button";

function getCurrentSpaceId(pathname: string) {
  const match = pathname.match(/^\/spaces\/([^/]+)/);
  return match?.[1] ?? "";
}

export function FeedbackForm({ error }: { error?: string }) {
  const pathname = usePathname();
  const [type, setType] = useState<"bug" | "feature_request" | "general_feedback">("bug");
  const currentSpaceId = getCurrentSpaceId(pathname);

  const pageContext = useMemo(
    () =>
      JSON.stringify({
        app: "caretaking",
        source: "in_app_feedback_form",
        currentPath: pathname,
        currentSpaceId: currentSpaceId || null
      }),
    [currentSpaceId, pathname]
  );

  return (
    <form action={submitFeedback} className="stack-card feedback-form">
      <div className="section-title">
        <p className="eyebrow">Product input</p>
        <h2>Submit feedback</h2>
        <p className="muted">Report a bug, request a feature, or share a quick product thought in under a minute.</p>
      </div>

      <input name="route" type="hidden" value={pathname} />
      <input name="spaceId" type="hidden" value={currentSpaceId} />
      <input name="pageContext" type="hidden" value={pageContext} />

      <label className="field">
        <span>Type</span>
        <select
          name="type"
          onChange={(event) => setType(event.target.value as "bug" | "feature_request" | "general_feedback")}
          value={type}
        >
          <option value="bug">Bug</option>
          <option value="feature_request">Feature request</option>
          <option value="general_feedback">General feedback</option>
        </select>
      </label>

      {type === "bug" ? (
        <label className="field">
          <span>Urgency</span>
          <select defaultValue="medium" name="severity">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </label>
      ) : null}

      <label className="field">
        <span>Subject</span>
        <input maxLength={140} name="subject" placeholder="Short summary" required />
      </label>

      <label className="field">
        <span>Description</span>
        <textarea
          name="description"
          placeholder="Add a few details if they will help us understand what happened or what would make this better."
          rows={5}
        />
      </label>

      <div className="feedback-context-card">
        <div>
          <strong>Captured automatically</strong>
          <p className="muted">Current route, signed-in account, timestamp, and current space when one is active.</p>
        </div>
        <p className="feedback-context-route">{pathname}</p>
      </div>

      <label className="toggle-label feedback-contact-toggle">
        <input defaultChecked name="contactAllowed" type="checkbox" />
        Follow up with me if more context would help.
      </label>

      {error ? <p className="error-text">{error}</p> : null}
      <SubmitButton className="button button-primary button-full" pendingLabel="Sending feedback...">
        Submit feedback
      </SubmitButton>
    </form>
  );
}
