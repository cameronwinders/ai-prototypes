import type { AppSupabaseClient } from "@/lib/domain/shared";
import type { Database } from "@/types/database";

export type ActionLogEmailLevel = "all" | "important_only" | "off";

export type EmailNotificationPreference = {
  enabled: boolean;
  action_log_email_level: ActionLogEmailLevel;
  reminder_completion_email_enabled: boolean;
};

const defaultEmailPreference: EmailNotificationPreference = {
  enabled: true,
  action_log_email_level: "important_only",
  reminder_completion_email_enabled: true
};

export async function getUnreadNotificationCount(client: AppSupabaseClient, userId: string, spaceId: string) {
  const { count, error } = await client
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("recipient_user_id", userId)
    .eq("space_id", spaceId)
    .neq("status", "read");

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function listNotifications(client: AppSupabaseClient, userId: string, spaceId: string) {
  const { data, error } = await client
    .from("notifications")
    .select("id, title, body, status, read_at, created_at, type, event_id, reminder_id")
    .eq("recipient_user_id", userId)
    .eq("space_id", spaceId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function markNotificationRead(client: AppSupabaseClient, notificationId: string) {
  const { data, error } = await client.rpc("mark_notification_read_mvp", {
    p_notification_id: notificationId
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to mark notification as read.");
  }
}

export async function getEmailNotificationPreference(
  client: AppSupabaseClient,
  userId: string,
  spaceId: string
): Promise<EmailNotificationPreference> {
  const { data, error } = await client
    .from("notification_preferences")
    .select("enabled, action_log_email_level, reminder_completion_email_enabled")
    .eq("user_id", userId)
    .eq("space_id", spaceId)
    .eq("channel", "email")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    return {
      enabled: data.enabled,
      action_log_email_level: data.action_log_email_level ?? defaultEmailPreference.action_log_email_level,
      reminder_completion_email_enabled:
        data.reminder_completion_email_enabled ?? defaultEmailPreference.reminder_completion_email_enabled
    };
  }

  await updateEmailNotificationPreference(client, {
    userId,
    spaceId,
    ...defaultEmailPreference
  });

  return defaultEmailPreference;
}

export async function updateEmailNotificationPreference(
  client: AppSupabaseClient,
  params: {
    userId: string;
    spaceId: string;
    enabled: boolean;
    action_log_email_level: ActionLogEmailLevel;
    reminder_completion_email_enabled: boolean;
  }
) {
  const row: Database["public"]["Tables"]["notification_preferences"]["Insert"] = {
    user_id: params.userId,
    space_id: params.spaceId,
    channel: "email",
    enabled: params.enabled,
    event_created_enabled: params.action_log_email_level !== "off",
    reminder_due_enabled: true,
    action_log_email_level: params.action_log_email_level,
    reminder_completion_email_enabled: params.reminder_completion_email_enabled
  };

  const { error } = await client
    .from("notification_preferences")
    .upsert(row, { onConflict: "user_id,space_id,channel" });

  if (error) {
    throw new Error(error.message);
  }
}
