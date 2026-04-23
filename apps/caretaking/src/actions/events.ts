"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import { sendEventLoggedEmails } from "@/lib/domain/email-notifications";
import { createSharedEvent } from "@/lib/domain/events";
import { createEventSchema } from "@/lib/validation/events";

export async function createEvent(formData: FormData) {
  const occurredAtRaw = String(formData.get("occurredAt") ?? "");
  const occurredDate = new Date(occurredAtRaw);

  const parsed = createEventSchema.safeParse({
    spaceId: String(formData.get("spaceId") ?? ""),
    subjectId: String(formData.get("subjectId") ?? ""),
    eventTypeId: String(formData.get("eventTypeId") ?? ""),
    occurredAt: Number.isNaN(occurredDate.getTime()) ? "" : occurredDate.toISOString(),
    summary: String(formData.get("summary") ?? ""),
    detailsJson: String(formData.get("detailsJson") ?? "")
  });

  if (!parsed.success) {
    const fallbackSpaceId = String(formData.get("spaceId") ?? "");
    redirect(
      `/spaces/${fallbackSpaceId}/events/new?error=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Invalid event data."
      )}`
    );
  }

  let redirectTo: string;

  try {
    const { supabase, user } = await requireUser();

    const event = await createSharedEvent({
      client: supabase,
      spaceId: parsed.data.spaceId,
      subjectId: parsed.data.subjectId || undefined,
      eventTypeId: parsed.data.eventTypeId,
      occurredAt: parsed.data.occurredAt,
      summary: parsed.data.summary || undefined,
      detailsJson: parsed.data.detailsJson || undefined
    });

    await sendEventLoggedEmails({ eventId: event.id, actorUserId: user.id }).catch((emailError) => {
      console.error("Unable to send logged-action emails", emailError);
    });

    const { count: otherCaregiverCount } = await supabase
      .from("space_memberships")
      .select("*", { count: "exact", head: true })
      .eq("space_id", parsed.data.spaceId)
      .eq("status", "active")
      .neq("user_id", user.id);

    redirectTo = `/spaces/${parsed.data.spaceId}/timeline?success=${encodeURIComponent(
      otherCaregiverCount && otherCaregiverCount > 0
        ? "Event added. Other caregivers will see it in Notifications."
        : "Event added to the shared timeline."
    )}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create event.";
    redirectTo = `/spaces/${parsed.data.spaceId}/events/new?error=${encodeURIComponent(message)}`;
  }

  redirect(redirectTo);
}
