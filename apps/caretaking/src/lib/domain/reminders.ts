import type { Json } from "@/types/database";

import { firstRelation, safeParseJson, type AppSupabaseClient } from "@/lib/domain/shared";

export async function createReminderEntry(params: {
  client: AppSupabaseClient;
  spaceId: string;
  subjectId?: string;
  eventTypeId?: string;
  assignedTo?: string;
  title: string;
  notes?: string;
  dueAt: string;
  payloadJson?: string;
  scheduleKind?: "one_time" | "daily" | "weekly";
}) {
  const payload = safeParseJson(params.payloadJson) as Json;

  const { data, error } = await params.client.rpc("create_reminder_mvp", {
    p_space_id: params.spaceId,
    p_subject_id: params.subjectId || null,
    p_event_type_id: params.eventTypeId || null,
    p_title: params.title,
    p_notes: params.notes || null,
    p_due_at: params.dueAt,
    p_assigned_to: params.assignedTo || null,
    p_payload: payload,
    p_schedule_kind: params.scheduleKind ?? "one_time"
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create reminder.");
  }

  return data;
}

export async function listUpcomingReminders(client: AppSupabaseClient, spaceId: string) {
  const { data, error } = await client
    .from("reminders")
    .select("id, title, notes, due_at, status, schedule_kind, profiles!reminders_assigned_to_fkey(display_name)")
    .eq("space_id", spaceId)
    .in("status", ["scheduled", "sent"])
    .order("due_at", { ascending: true })
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((reminder: any) => ({
    ...reminder,
    profiles: firstRelation(reminder.profiles)
  }));
}

export async function listCompletedReminders(client: AppSupabaseClient, spaceId: string) {
  const { data, error } = await client
    .from("reminders")
    .select("id, title, notes, due_at, status, schedule_kind, completed_at, profiles!reminders_assigned_to_fkey(display_name)")
    .eq("space_id", spaceId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((reminder: any) => ({
    ...reminder,
    profiles: firstRelation(reminder.profiles)
  }));
}

export async function completeReminderEntry(client: AppSupabaseClient, reminderId: string) {
  const { data, error } = await client.rpc("complete_reminder_mvp", {
    p_reminder_id: reminderId
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to complete reminder.");
  }
}
