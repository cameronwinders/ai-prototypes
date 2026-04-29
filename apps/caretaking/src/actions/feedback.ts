"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireFeedbackReviewer } from "@/lib/auth/feedback-reviewers";
import { requireUser } from "@/lib/auth/guards";
import { createFeedbackSubmission, updateFeedbackSubmissionStatus, type FeedbackSubmissionRecord } from "@/lib/domain/feedback";
import { createAdminClient } from "@/lib/supabase/admin";
import { submitFeedbackSchema } from "@/lib/validation/feedback";
import type { Json } from "@/types/database";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function submitFeedback(formData: FormData) {
  const parsed = submitFeedbackSchema.safeParse({
    type: getString(formData, "type"),
    subject: getString(formData, "subject"),
    description: getString(formData, "description"),
    route: getString(formData, "route"),
    severity: getString(formData, "severity"),
    contactAllowed: getBoolean(formData, "contactAllowed"),
    spaceId: getString(formData, "spaceId"),
    pageContext: getString(formData, "pageContext")
  });

  if (!parsed.success) {
    redirect(`/feedback?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid feedback submission.")}`);
  }

  let redirectTo = `/feedback?success=${encodeURIComponent("Thanks for the feedback. We'll review it with the rest of the product input.")}`;

  try {
    const { supabase, user } = await requireUser();
    const pageContext = JSON.parse(parsed.data.pageContext) as Json;

    await createFeedbackSubmission(supabase, {
      userId: user.id,
      spaceId: parsed.data.spaceId,
      type: parsed.data.type,
      subject: parsed.data.subject,
      description: parsed.data.description || null,
      route: parsed.data.route,
      severity: parsed.data.severity,
      contactAllowed: parsed.data.contactAllowed,
      pageContext
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit feedback.";
    redirectTo = `/feedback?error=${encodeURIComponent(message)}`;
  }

  redirect(redirectTo);
}

function parseFeedbackStatus(value: FormDataEntryValue | null): FeedbackSubmissionRecord["status"] {
  if (value === "new" || value === "reviewing" || value === "planned" || value === "closed") {
    return value;
  }

  throw new Error("Invalid feedback status.");
}

export async function updateFeedbackStatus(formData: FormData) {
  const statusFilter = String(formData.get("statusFilter") ?? "all");
  const feedbackId = String(formData.get("feedbackId") ?? "");
  let redirectTo = `/feedback/review?status=${encodeURIComponent(statusFilter)}`;
  await requireFeedbackReviewer();

  try {
    if (!feedbackId) {
      throw new Error("Missing feedback record.");
    }

    const status = parseFeedbackStatus(formData.get("status"));
    const admin = createAdminClient();

    await updateFeedbackSubmissionStatus(admin, {
      feedbackId,
      status
    });

    revalidatePath("/feedback");
    revalidatePath("/feedback/review");
    redirectTo = `${redirectTo}&success=${encodeURIComponent("Feedback status updated.")}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update feedback status.";
    redirectTo = `${redirectTo}&error=${encodeURIComponent(message)}`;
  }

  redirect(redirectTo);
}
