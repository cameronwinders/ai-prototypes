import { buildEmailSubject, sendActivityEmail } from "@/lib/email/activity";
import { getProfileDisplayName } from "@/lib/domain/profiles";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/supabase/env";

type PreferenceRow = {
  enabled?: boolean | null;
  action_log_email_level?: "all" | "important_only" | "off" | null;
  reminder_completion_email_enabled?: boolean | null;
};

type Recipient = {
  userId: string;
  email: string;
  timezone: string;
};

const defaultPreference = {
  enabled: true,
  action_log_email_level: "important_only" as const,
  reminder_completion_email_enabled: true
};

export async function sendEventLoggedEmails(params: { eventId: string; actorUserId: string }) {
  const admin = createAdminClient();

  const { data: event, error: eventError } = await admin
    .from("events")
    .select(
      "id, space_id, actor_user_id, occurred_at, summary, spaces(name), event_types(name, default_notify), subjects(name), profiles!events_actor_user_id_fkey(display_name, preferred_name)"
    )
    .eq("id", params.eventId)
    .single();

  if (eventError || !event) {
    throw new Error(eventError?.message ?? "Unable to load event for email notification.");
  }

  const eventType = firstRelation<any>(event.event_types);
  const defaultNotify = Boolean(eventType?.default_notify);
  const actionSummary = event.summary?.trim() || `${eventType?.name ?? "Action"} logged`;
  const spaceName = firstRelation<any>(event.spaces)?.name ?? "Care space";
  const subjectName = firstRelation<any>(event.subjects)?.name;
  const actorName = getProfileDisplayName(firstRelation<any>(event.profiles), "Another caregiver");

  const { data: memberships, error: membershipsError } = await admin
    .from("space_memberships")
    .select("user_id")
    .eq("space_id", event.space_id)
    .eq("status", "active")
    .neq("user_id", params.actorUserId);

  if (membershipsError) {
    throw new Error(membershipsError.message);
  }

  for (const membership of memberships ?? []) {
    const notification = await getOrCreateEventLoggedNotification(admin, {
      spaceId: event.space_id,
      eventId: event.id,
      recipientUserId: membership.user_id,
      title: `${eventType?.name ?? "Action"} logged`,
      body: event.summary ?? null
    });
    const preference = await getEmailPreference(admin, membership.user_id, event.space_id);
    const shouldSend =
      preference.enabled &&
      preference.action_log_email_level !== "off" &&
      (preference.action_log_email_level === "all" || defaultNotify);

    if (!shouldSend) {
      continue;
    }

    const recipient = await getRecipient(admin, membership.user_id);

    if (!recipient) {
      await recordEmailDeliveryFailure(admin, notification.id, "Recipient email is unavailable.");
      continue;
    }

    await sendNotificationEmail({
      admin,
      notificationId: notification.id,
      recipient,
      subject: buildEmailSubject(spaceName, actionSummary),
      heading: actionSummary,
      lines: [
        `Care space: ${spaceName}`,
        `Action type: ${eventType?.name ?? "Logged action"}`,
        subjectName ? `Subject: ${subjectName}` : "",
        `When: ${formatTimestamp(event.occurred_at, recipient.timezone)}`,
        `Logged by: ${actorName}`
      ].filter(Boolean),
      ctaUrl: `${getSiteUrl()}/spaces/${event.space_id}/timeline`,
      idempotencyKey: `event-${event.id}-${membership.user_id}`
    });
  }
}

export async function sendReminderCompletedEmails(params: { reminderId: string; actorUserId: string }) {
  const admin = createAdminClient();

  const { data: reminder, error: reminderError } = await admin
    .from("reminders")
    .select("id, space_id, title, completed_at, due_at, status, spaces(name), subjects(name)")
    .eq("id", params.reminderId)
    .single();

  if (reminderError || !reminder) {
    throw new Error(reminderError?.message ?? "Unable to load reminder for email notification.");
  }

  if (reminder.status !== "completed") {
    return;
  }

  const { data: actorProfile } = await admin
    .from("profiles")
    .select("display_name, preferred_name")
    .eq("id", params.actorUserId)
    .maybeSingle();

  const spaceName = firstRelation<any>(reminder.spaces)?.name ?? "Care space";
  const subjectName = firstRelation<any>(reminder.subjects)?.name;
  const actorName = getProfileDisplayName(actorProfile, "Another caregiver");

  const { data: memberships, error: membershipsError } = await admin
    .from("space_memberships")
    .select("user_id")
    .eq("space_id", reminder.space_id)
    .eq("status", "active")
    .neq("user_id", params.actorUserId);

  if (membershipsError) {
    throw new Error(membershipsError.message);
  }

  for (const membership of memberships ?? []) {
    const notification = await getOrCreateReminderCompletedNotification(admin, {
      spaceId: reminder.space_id,
      reminderId: reminder.id,
      recipientUserId: membership.user_id,
      title: `${reminder.title} completed`,
      body: `Completed by ${actorName}.`
    });

    const preference = await getEmailPreference(admin, membership.user_id, reminder.space_id);

    if (!preference.enabled || !preference.reminder_completion_email_enabled) {
      continue;
    }

    const recipient = await getRecipient(admin, membership.user_id);

    if (!recipient) {
      await recordEmailDeliveryFailure(admin, notification.id, "Recipient email is unavailable.");
      continue;
    }

    await sendNotificationEmail({
      admin,
      notificationId: notification.id,
      recipient,
      subject: buildEmailSubject(spaceName, `Reminder completed - ${reminder.title}`),
      heading: `Reminder completed: ${reminder.title}`,
      lines: [
        `Care space: ${spaceName}`,
        `Action type: Reminder completed`,
        subjectName ? `Subject: ${subjectName}` : "",
        `When: ${formatTimestamp(reminder.completed_at ?? new Date().toISOString(), recipient.timezone)}`,
        `Completed by: ${actorName}`
      ].filter(Boolean),
      ctaUrl: `${getSiteUrl()}/spaces/${reminder.space_id}/reminders`,
      idempotencyKey: `reminder-completed-${reminder.id}-${membership.user_id}`
    });
  }
}

async function getEmailPreference(admin: ReturnType<typeof createAdminClient>, userId: string, spaceId: string) {
  const { data } = await admin
    .from("notification_preferences")
    .select("enabled, action_log_email_level, reminder_completion_email_enabled")
    .eq("user_id", userId)
    .eq("space_id", spaceId)
    .eq("channel", "email")
    .maybeSingle();

  const preference = (data ?? {}) as PreferenceRow;

  return {
    enabled: preference.enabled ?? defaultPreference.enabled,
    action_log_email_level: preference.action_log_email_level ?? defaultPreference.action_log_email_level,
    reminder_completion_email_enabled:
      preference.reminder_completion_email_enabled ?? defaultPreference.reminder_completion_email_enabled
  };
}

async function getRecipient(admin: ReturnType<typeof createAdminClient>, userId: string): Promise<Recipient | null> {
  const [{ data: authData }, { data: profile }] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin.from("profiles").select("timezone").eq("id", userId).maybeSingle()
  ]);

  if (!authData.user?.email) {
    return null;
  }

  return {
    userId,
    email: authData.user.email,
    timezone: profile?.timezone || "America/Chicago"
  };
}

async function getOrCreateReminderCompletedNotification(
  admin: ReturnType<typeof createAdminClient>,
  params: { spaceId: string; reminderId: string; recipientUserId: string; title: string; body: string }
) {
  const { data: existing } = await admin
    .from("notifications")
    .select("id")
    .eq("space_id", params.spaceId)
    .eq("reminder_id", params.reminderId)
    .eq("recipient_user_id", params.recipientUserId)
    .eq("type", "reminder_completed")
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const { data, error } = await admin
    .from("notifications")
    .insert({
      space_id: params.spaceId,
      recipient_user_id: params.recipientUserId,
      type: "reminder_completed",
      reminder_id: params.reminderId,
      title: params.title,
      body: params.body,
      status: "pending"
    })
    .select("id")
    .single();

  if (error || !data) {
    if ((error as { code?: string } | null)?.code === "23505") {
      const { data: duplicate } = await admin
        .from("notifications")
        .select("id")
        .eq("space_id", params.spaceId)
        .eq("reminder_id", params.reminderId)
        .eq("recipient_user_id", params.recipientUserId)
        .eq("type", "reminder_completed")
        .single();

      if (duplicate) {
        return duplicate;
      }
    }

    throw new Error(error?.message ?? "Unable to create reminder completion notification.");
  }

  await admin.from("notification_deliveries").insert({
    notification_id: data.id,
    channel: "in_app",
    status: "delivered",
    delivered_at: new Date().toISOString()
  });

  return data;
}

async function getOrCreateEventLoggedNotification(
  admin: ReturnType<typeof createAdminClient>,
  params: { spaceId: string; eventId: string; recipientUserId: string; title: string; body: string | null }
) {
  const { data: existing } = await admin
    .from("notifications")
    .select("id")
    .eq("space_id", params.spaceId)
    .eq("event_id", params.eventId)
    .eq("recipient_user_id", params.recipientUserId)
    .eq("type", "event_created")
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const { data, error } = await admin
    .from("notifications")
    .insert({
      space_id: params.spaceId,
      recipient_user_id: params.recipientUserId,
      type: "event_created",
      event_id: params.eventId,
      title: params.title,
      body: params.body,
      status: "pending"
    })
    .select("id")
    .single();

  if (error || !data) {
    if ((error as { code?: string } | null)?.code === "23505") {
      const { data: duplicate } = await admin
        .from("notifications")
        .select("id")
        .eq("space_id", params.spaceId)
        .eq("event_id", params.eventId)
        .eq("recipient_user_id", params.recipientUserId)
        .eq("type", "event_created")
        .single();

      if (duplicate) {
        return duplicate;
      }
    }

    throw new Error(error?.message ?? "Unable to create logged-action notification.");
  }

  await admin.from("notification_deliveries").insert({
    notification_id: data.id,
    channel: "in_app",
    status: "delivered",
    delivered_at: new Date().toISOString()
  });

  return data;
}

async function sendNotificationEmail(params: {
  admin: ReturnType<typeof createAdminClient>;
  notificationId: string;
  recipient: Recipient;
  subject: string;
  heading: string;
  lines: string[];
  ctaUrl: string;
  idempotencyKey: string;
}) {
  const { data: delivery, error: deliveryError } = await params.admin
    .from("notification_deliveries")
    .insert({
      notification_id: params.notificationId,
      channel: "email",
      provider: "resend",
      status: "queued",
      metadata: { to: params.recipient.email }
    })
    .select("id")
    .single();

  // A unique partial index protects users from duplicate emails for the same notification.
  if (deliveryError || !delivery) {
    if ((deliveryError as { code?: string } | null)?.code === "23505") {
      return;
    }

    throw new Error(deliveryError?.message ?? "Unable to record email delivery attempt.");
  }

  try {
    const result = await sendActivityEmail({
      to: params.recipient.email,
      subject: params.subject,
      heading: params.heading,
      lines: params.lines,
      ctaUrl: params.ctaUrl,
      idempotencyKey: params.idempotencyKey
    });

    await params.admin
      .from("notification_deliveries")
      .update({
        status: "delivered",
        provider_message_id: result.providerMessageId,
        delivered_at: new Date().toISOString(),
        error_message: null
      })
      .eq("id", delivery.id);
  } catch (error) {
    await params.admin
      .from("notification_deliveries")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Email delivery failed."
      })
      .eq("id", delivery.id);
  }
}

async function recordEmailDeliveryFailure(
  admin: ReturnType<typeof createAdminClient>,
  notificationId: string,
  errorMessage: string
) {
  const { error } = await admin.from("notification_deliveries").insert({
    notification_id: notificationId,
    channel: "email",
    provider: "resend",
    status: "failed",
    error_message: errorMessage
  });

  if ((error as { code?: string } | null)?.code !== "23505" && error) {
    console.error("Unable to record email delivery failure", error);
  }
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function formatTimestamp(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone
  }).format(new Date(value));
}
