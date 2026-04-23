import { redirect } from "next/navigation";

import { AccountMenu } from "@/components/layout/account-menu";
import { getProfileDisplayName } from "@/lib/domain/profiles";
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

  return (
    <>
      <div className="account-bar">
        <AccountMenu displayName={displayName} relationshipLabel={profile?.relationship_label} />
      </div>
      {children}
    </>
  );
}
