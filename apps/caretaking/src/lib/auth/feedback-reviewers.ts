import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";

const DEFAULT_FEEDBACK_REVIEWERS = ["cameronwinders@gmail.com"];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getFeedbackReviewerEmails() {
  const configured = process.env.FEEDBACK_REVIEWER_EMAILS
    ?.split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);

  if (configured && configured.length > 0) {
    return configured;
  }

  return DEFAULT_FEEDBACK_REVIEWERS;
}

export function isFeedbackReviewer(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  return getFeedbackReviewerEmails().includes(normalizeEmail(email));
}

export async function requireFeedbackReviewer() {
  const result = await requireUser();

  if (!isFeedbackReviewer(result.user.email)) {
    redirect("/feedback?error=This review area is limited to the internal product team.");
  }

  return result;
}
