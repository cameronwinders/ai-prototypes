"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import { updateUserProfile } from "@/lib/domain/profiles";

export async function saveProfile(formData: FormData) {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const preferredName = String(formData.get("preferredName") ?? "").trim();
  const legalName = String(formData.get("legalName") ?? "").trim();
  const relationshipLabel = String(formData.get("relationshipLabel") ?? "").trim();

  if (displayName.length > 120 || preferredName.length > 80 || legalName.length > 160 || relationshipLabel.length > 80) {
    redirect(`/profile?error=${encodeURIComponent("Please shorten one of the profile fields.")}`);
  }

  let redirectTo = "/profile?success=Profile%20saved.";

  try {
    const { supabase, user } = await requireUser();

    await updateUserProfile(supabase, {
      userId: user.id,
      displayName: displayName || preferredName || user.email?.split("@")[0] || "Caregiver",
      preferredName,
      legalName,
      relationshipLabel
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save profile.";
    redirectTo = `/profile?error=${encodeURIComponent(message)}`;
  }

  redirect(redirectTo);
}
