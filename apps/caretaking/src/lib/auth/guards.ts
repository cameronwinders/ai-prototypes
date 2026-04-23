import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: user.user_metadata?.display_name || user.email?.split("@")[0] || "Caregiver",
    avatar_url: user.user_metadata?.avatar_url || null,
    timezone: user.user_metadata?.timezone || "UTC"
  }, {
    onConflict: "id",
    ignoreDuplicates: true
  });

  if (profileError) {
    throw new Error(profileError.message);
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
