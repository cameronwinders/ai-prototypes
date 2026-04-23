"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import { updateEmailNotificationPreference, type ActionLogEmailLevel } from "@/lib/domain/notifications";

const actionLogLevels = new Set<ActionLogEmailLevel>(["all", "important_only", "off"]);

export async function saveEmailNotificationPreferences(formData: FormData) {
  const spaceId = String(formData.get("spaceId") ?? "");
  const rawLevel = String(formData.get("actionLogEmailLevel") ?? "important_only");
  const actionLogEmailLevel: ActionLogEmailLevel = actionLogLevels.has(rawLevel as ActionLogEmailLevel)
    ? (rawLevel as ActionLogEmailLevel)
    : "important_only";

  if (!spaceId) {
    redirect(`/spaces/new?error=${encodeURIComponent("Choose a care space before updating notification settings.")}`);
  }

  let redirectTo = `/spaces/${spaceId}/notifications?success=${encodeURIComponent("Email notification settings saved.")}`;

  try {
    const { supabase, user } = await requireUser();

    await updateEmailNotificationPreference(supabase, {
      userId: user.id,
      spaceId,
      enabled: formData.get("emailNotificationsEnabled") === "on",
      action_log_email_level: actionLogEmailLevel,
      reminder_completion_email_enabled: formData.get("reminderCompletionEmailEnabled") === "on"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save notification settings.";
    redirectTo = `/spaces/${spaceId}/notifications?error=${encodeURIComponent(message)}`;
  }

  redirect(redirectTo);
}
