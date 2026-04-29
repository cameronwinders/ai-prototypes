import "server-only";

import { redirect } from "next/navigation";

import { ensureProfileForUser } from "@/lib/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminAllowlist, getPublicSupabaseEnv, getServerSupabaseEnv } from "@/lib/supabase/env";
import type { ViewerContext } from "@/lib/types";

export async function getViewerContext(): Promise<ViewerContext> {
  const publicEnv = getPublicSupabaseEnv();
  const serverEnv = getServerSupabaseEnv();

  if (!publicEnv.isConfigured) {
    return {
      user: null,
      profile: null,
      isConfigured: false,
      hasServiceRole: serverEnv.hasServiceRole,
      isAdmin: false
    };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      profile: null,
      isConfigured: true,
      hasServiceRole: serverEnv.hasServiceRole,
      isAdmin: false
    };
  }

  const profile = serverEnv.hasServiceRole ? await ensureProfileForUser(user) : null;
  const email = user.email?.toLowerCase() ?? null;
  const isAdmin = email ? getAdminAllowlist().includes(email) : false;

  return {
    user: {
      id: user.id,
      email: user.email ?? null
    },
    profile,
    isConfigured: true,
    hasServiceRole: serverEnv.hasServiceRole,
    isAdmin
  };
}

export async function requireViewer(nextPath: string) {
  const viewer = await getViewerContext();

  if (!viewer.user) {
    redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  }

  return viewer;
}

export async function requireOnboardedViewer(nextPath: string) {
  const viewer = await requireViewer(nextPath);

  if (!viewer.profile?.onboarding_completed || !viewer.profile.handicap_band) {
    redirect(`/onboarding?next=${encodeURIComponent(nextPath)}`);
  }

  return viewer;
}

export async function requireAdminViewer(nextPath: string) {
  const viewer = await requireViewer(nextPath);

  if (!viewer.isAdmin) {
    redirect("/leaderboard");
  }

  return viewer;
}
