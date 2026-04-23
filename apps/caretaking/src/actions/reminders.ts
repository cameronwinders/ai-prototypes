"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import { sendReminderCompletedEmails } from "@/lib/domain/email-notifications";
import { completeReminderEntry, createReminderEntry } from "@/lib/domain/reminders";
import { createReminderSchema } from "@/lib/validation/reminders";

export async function createReminder(formData: FormData) {
  const dueAtRaw = String(formData.get("dueAt") ?? "");
  const dueDate = new Date(dueAtRaw);

  const parsed = createReminderSchema.safeParse({
    spaceId: String(formData.get("spaceId") ?? ""),
    subjectId: String(formData.get("subjectId") ?? ""),
    eventTypeId: String(formData.get("eventTypeId") ?? ""),
    assignedTo: String(formData.get("assignedTo") ?? ""),
    title: String(formData.get("title") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    dueAt: Number.isNaN(dueDate.getTime()) ? "" : dueDate.toISOString(),
    payloadJson: String(formData.get("payloadJson") ?? ""),
    scheduleKind: String(formData.get("scheduleKind") ?? "one_time")
  });

  if (!parsed.success) {
    const fallbackSpaceId = String(formData.get("spaceId") ?? "");
    redirect(
      `/spaces/${fallbackSpaceId}/reminders/new?error=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Invalid reminder data."
      )}`
    );
  }

  let redirectTo: string;

  try {
    const { supabase } = await requireUser();

    await createReminderEntry({
      client: supabase,
      spaceId: parsed.data.spaceId,
      subjectId: parsed.data.subjectId || undefined,
      eventTypeId: parsed.data.eventTypeId || undefined,
      assignedTo: parsed.data.assignedTo || undefined,
      title: parsed.data.title,
      notes: parsed.data.notes || undefined,
      dueAt: parsed.data.dueAt,
      payloadJson: parsed.data.payloadJson || undefined,
      scheduleKind: parsed.data.scheduleKind
    });

    redirectTo = `/spaces/${parsed.data.spaceId}/timeline?success=${encodeURIComponent(
      parsed.data.scheduleKind === "one_time" ? "Reminder created." : "Repeating reminder created."
    )}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create reminder.";
    redirectTo = `/spaces/${parsed.data.spaceId}/reminders/new?error=${encodeURIComponent(message)}`;
  }

  redirect(redirectTo);
}

export async function completeReminder(formData: FormData) {
  const reminderId = String(formData.get("reminderId") ?? "");
  const spaceId = String(formData.get("spaceId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? `/spaces/${spaceId}/reminders`);

  if (!reminderId || !spaceId) {
    redirect(`${returnTo}?error=${encodeURIComponent("Unable to complete reminder.")}`);
  }

  let redirectTo = `${returnTo}?success=${encodeURIComponent("Reminder completed.")}`;

  try {
    const { supabase, user } = await requireUser();
    await completeReminderEntry(supabase, reminderId);
    await sendReminderCompletedEmails({ reminderId, actorUserId: user.id }).catch((emailError) => {
      console.error("Unable to send reminder-completion emails", emailError);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to complete reminder.";
    redirectTo = `${returnTo}?error=${encodeURIComponent(message)}`;
  }

  redirect(redirectTo);
}
