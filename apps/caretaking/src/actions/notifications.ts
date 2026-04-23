"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import { markNotificationRead } from "@/lib/domain/notifications";

export async function markNotificationAsRead(formData: FormData) {
  const notificationId = String(formData.get("notificationId") ?? "");
  const spaceId = String(formData.get("spaceId") ?? "");

  if (!notificationId || !spaceId) {
    redirect(`/spaces/${spaceId}/notifications?error=${encodeURIComponent("Missing notification data.")}`);
  }

  let redirectTo: string;

  try {
    const { supabase } = await requireUser();
    await markNotificationRead(supabase, notificationId);
    redirectTo = `/spaces/${spaceId}/notifications?success=${encodeURIComponent("Notification marked as read.")}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to mark notification as read.";
    redirectTo = `/spaces/${spaceId}/notifications?error=${encodeURIComponent(message)}`;
  }

  redirect(redirectTo);
}
