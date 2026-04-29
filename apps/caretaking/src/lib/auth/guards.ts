import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { TIMEZONE_COOKIE_NAME, resolveTimezone, shouldRefreshTimezone } from "@/lib/timezone";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const cookieStore = await cookies();
  const browserTimezone = cookieStore.get(TIMEZONE_COOKIE_NAME)?.value;
  const fallbackDisplayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "Caregiver";
  const fallbackAvatarUrl = user.user_metadata?.avatar_url || null;
  const fallbackTimezone = resolveTimezone(browserTimezone, user.user_metadata?.timezone);

  const { data: profile, error: profileLookupError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, timezone")
    .eq("id", user.id)
    .maybeSingle();

  if (profileLookupError) {
    throw new Error(profileLookupError.message);
  }

  if (!profile) {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      display_name: fallbackDisplayName,
      avatar_url: fallbackAvatarUrl,
      timezone: fallbackTimezone
    });

    if (insertError) {
      throw new Error(insertError.message);
    }
  } else {
    const updates: Record<string, string | null> = {};

    if (!profile.display_name?.trim()) {
      updates.display_name = fallbackDisplayName;
    }

    if (!profile.avatar_url && fallbackAvatarUrl) {
      updates.avatar_url = fallbackAvatarUrl;
    }

    if (shouldRefreshTimezone(profile.timezone, browserTimezone) || shouldRefreshTimezone(profile.timezone, user.user_metadata?.timezone)) {
      updates.timezone = fallbackTimezone;
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase.from("profiles").update(updates).eq("id", user.id);

      if (updateError) {
        throw new Error(updateError.message);
      }
    }
  }

  return { supabase, user };
}

export async function requireSpaceMembership(spaceId: string) {
  const { supabase, user } = await requireUser();

  const { data: membership } = await supabase
    .from("space_memberships")
    .select("id, status, roles(key, name)")
    .eq("space_id", spaceId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership) {
    redirect("/spaces");
  }

  return { supabase, user, membership };
}
