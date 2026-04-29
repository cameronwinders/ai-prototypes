import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppNavigation } from "@/components/layout/app-navigation";
import { isFeedbackReviewer } from "@/lib/auth/feedback-reviewers";
import { getProfileDisplayName } from "@/lib/domain/profiles";
import { getLastSpaceId, resolvePreferredSpaceId } from "@/lib/domain/space-preferences";
import { listUserSpaces } from "@/lib/domain/spaces";
import { createClient } from "@/lib/supabase/server";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, preferred_name, legal_name, relationship_label, avatar_url, timezone")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = getProfileDisplayName(profile, user.email?.split("@")[0] ?? "Caregiver");
  const spaces = await listUserSpaces(supabase, user.id);
  const cookieStore = await cookies();
  const preferredSpaceId = resolvePreferredSpaceId(spaces, getLastSpaceId(cookieStore));

  return (
    <div className="app-frame">
      <AppNavigation
        defaultSpaceId={preferredSpaceId ?? undefined}
        displayName={displayName}
        relationshipLabel={profile?.relationship_label}
        showFeedbackReview={isFeedbackReviewer(user.email)}
        spaces={spaces}
      />
      <div className="app-main">
        {children}
      </div>
    </div>
  );
}
