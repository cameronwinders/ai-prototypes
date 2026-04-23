import type { AppSupabaseClient } from "@/lib/domain/shared";

export type UserProfile = {
  id: string;
  display_name: string;
  preferred_name: string | null;
  legal_name: string | null;
  relationship_label: string | null;
  avatar_url: string | null;
  timezone: string;
};

export function getProfileDisplayName(
  profile: { preferred_name?: string | null; display_name?: string | null } | null | undefined,
  fallback = "Caregiver"
) {
  const displayName = profile?.display_name?.trim();

  if (profile?.preferred_name?.trim()) {
    return profile.preferred_name.trim();
  }

  // Avoid exposing generated email fragments like "name+test" in shared care-team views.
  if (displayName && !displayName.includes("@") && !displayName.includes("+")) {
    return displayName;
  }

  return fallback;
}

export async function getUserProfile(client: AppSupabaseClient, userId: string) {
  const { data, error } = await client
    .from("profiles")
    .select("id, display_name, preferred_name, legal_name, relationship_label, avatar_url, timezone")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateUserProfile(
  client: AppSupabaseClient,
  params: {
    userId: string;
    displayName: string;
    preferredName?: string;
    legalName?: string;
    relationshipLabel?: string;
  }
) {
  const { error } = await client
    .from("profiles")
    .update({
      display_name: params.displayName,
      preferred_name: params.preferredName || null,
      legal_name: params.legalName || null,
      relationship_label: params.relationshipLabel || null
    })
    .eq("id", params.userId);

  if (error) {
    throw new Error(error.message);
  }
}
