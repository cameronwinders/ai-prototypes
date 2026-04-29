import type { Json } from "@/types/database";
import { firstRelation, type AppSupabaseClient } from "@/lib/domain/shared";

export type FeedbackSubmissionRecord = {
  id: string;
  type: "bug" | "feature_request" | "general_feedback";
  subject: string;
  description: string | null;
  route: string;
  severity: "low" | "medium" | "high" | "critical" | null;
  status: "new" | "reviewing" | "planned" | "closed";
  contact_allowed: boolean;
  created_at: string;
  page_context: Json;
  spaces: { id: string; name: string } | null;
};

export type FeedbackReviewRecord = Omit<FeedbackSubmissionRecord, "user_id"> & {
  user_id: string;
  profiles: {
    id: string;
    display_name: string;
    preferred_name: string | null;
    relationship_label: string | null;
  } | null;
};

export async function createFeedbackSubmission(
  client: AppSupabaseClient,
  input: {
    userId: string;
    spaceId?: string | null;
    type: "bug" | "feature_request" | "general_feedback";
    subject: string;
    description?: string | null;
    route: string;
    severity?: "low" | "medium" | "high" | "critical" | null;
    contactAllowed: boolean;
    pageContext: Json;
  }
) {
  const { data, error } = await client
    .from("feedback_submissions")
    .insert({
      user_id: input.userId,
      space_id: input.spaceId ?? null,
      type: input.type,
      subject: input.subject,
      description: input.description ?? null,
      route: input.route,
      severity: input.severity ?? null,
      contact_allowed: input.contactAllowed,
      page_context: input.pageContext,
      status: "new"
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to save feedback.");
  }

  return data;
}

export async function listFeedbackSubmissions(client: AppSupabaseClient, userId: string) {
  const { data, error } = await client
    .from("feedback_submissions")
    .select("id, type, subject, description, route, severity, status, contact_allowed, created_at, page_context, spaces(id, name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => ({
    ...item,
    spaces: firstRelation(item.spaces)
  })) as FeedbackSubmissionRecord[];
}

export async function listFeedbackSubmissionsForReview(
  client: AppSupabaseClient,
  options: {
    status?: FeedbackSubmissionRecord["status"] | "all";
    limit?: number;
  } = {}
) {
  let query = client
    .from("feedback_submissions")
    .select("id, user_id, type, subject, description, route, severity, status, contact_allowed, created_at, page_context, spaces(id, name), profiles(id, display_name, preferred_name, relationship_label)")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 50);

  if (options.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => ({
    ...item,
    spaces: firstRelation(item.spaces),
    profiles: firstRelation(item.profiles)
  })) as FeedbackReviewRecord[];
}

export async function updateFeedbackSubmissionStatus(
  client: AppSupabaseClient,
  input: {
    feedbackId: string;
    status: FeedbackSubmissionRecord["status"];
  }
) {
  const { error } = await client
    .from("feedback_submissions")
    .update({
      status: input.status
    })
    .eq("id", input.feedbackId);

  if (error) {
    throw new Error(error.message);
  }
}
