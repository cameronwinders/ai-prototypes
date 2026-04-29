import { AppShell } from "@/components/layout/app-shell";
import { ProfileForm } from "@/components/profile/profile-form";
import { Card, SectionTitle } from "@/components/ui/design";
import { requireUser } from "@/lib/auth/guards";
import { getProfileDisplayName, getUserProfile } from "@/lib/domain/profiles";
import { listUserSpaces } from "@/lib/domain/spaces";

type ProfilePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const params = await searchParams;
  const { supabase, user } = await requireUser();
  const [profile, spaces] = await Promise.all([getUserProfile(supabase, user.id), listUserSpaces(supabase, user.id)]);
  const success = typeof params.success === "string" ? params.success : "";
  const error = typeof params.error === "string" ? params.error : "";
  const displayName = getProfileDisplayName(profile, user.email ?? "Caregiver");
  const firstSpace = spaces[0];

  return (
    <AppShell
      title="Profile"
      subtitle={`Signed in as ${displayName}.`}
      actionHref={firstSpace ? `/spaces/${firstSpace.id}/timeline` : "/spaces"}
      actionLabel={firstSpace ? "Dashboard" : "Spaces"}
      spaceId={firstSpace?.id}
    >
      <div className="section compact-section">
        {success ? <div className="banner success-text">{success}</div> : null}
        {error ? <div className="banner error-text">{error}</div> : null}
      </div>

      <div className="dashboard-grid section">
        <ProfileForm email={user.email ?? ""} profile={profile} />
        <Card>
          <SectionTitle title="How this is used" description="Caretaking App uses your preferred name where it helps others recognize who logged an update or completed a reminder." />
          <div className="profile-preview">
            <div className="avatar-mark" aria-hidden="true">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <strong>{displayName}</strong>
              <p className="muted">{profile.relationship_label || "Care team member"}</p>
              <p className="muted">Timezone: {profile.timezone}</p>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
