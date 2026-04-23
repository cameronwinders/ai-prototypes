import { firstRelation, safeParseJson, type AppSupabaseClient } from "@/lib/domain/shared";

export async function createSharedEvent(params: {
  client: AppSupabaseClient;
  spaceId: string;
  subjectId?: string;
  eventTypeId: string;
  occurredAt: string;
  summary?: string;
  detailsJson?: string;
}) {
  const details = safeParseJson(params.detailsJson);
  const { data: eventId, error } = await params.client.rpc("create_event_mvp", {
    p_space_id: params.spaceId,
    p_subject_id: params.subjectId || null,
    p_event_type_id: params.eventTypeId,
    p_occurred_at: params.occurredAt,
    p_summary: params.summary || null,
    p_details: details
  });

  if (error || !eventId) {
    throw new Error(error?.message ?? "Unable to create event.");
  }

  return { id: eventId };
}

export async function listTimelineItems(params: {
  client: AppSupabaseClient;
  spaceId: string;
  limit?: number;
}) {
  const { data, error } = await params.client
    .from("events")
    .select(
      "id, occurred_at, summary, details, event_types(name, icon, color), subjects(name), profiles!events_actor_user_id_fkey(display_name, preferred_name)"
    )
    .eq("space_id", params.spaceId)
    .eq("status", "active")
    .order("occurred_at", { ascending: false })
    .limit(params.limit ?? 30);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => ({
    ...item,
    event_types: firstRelation(item.event_types),
    subjects: firstRelation(item.subjects),
    profiles: firstRelation(item.profiles)
  }));
}
