import { saveProfile } from "@/actions/profile";
import { SubmitButton } from "@/components/ui/submit-button";
import type { UserProfile } from "@/lib/domain/profiles";
import { DEFAULT_TIMEZONE } from "@/lib/timezone";

type ProfileFormProps = {
  email: string;
  profile: UserProfile;
};

export function ProfileForm({ email, profile }: ProfileFormProps) {
  return (
    <form className="stack-card profile-form" action={saveProfile}>
      <div className="section-header">
        <h2>Your profile</h2>
        <p className="muted">Names are shown to caregivers in your shared spaces.</p>
      </div>

      <label className="field">
        <span>Email</span>
        <input value={email} disabled />
      </label>

      <label className="field">
        <span>Display name</span>
        <input name="displayName" defaultValue={profile.display_name} placeholder="How your name should appear" />
      </label>

      <label className="field">
        <span>Preferred name</span>
        <input name="preferredName" defaultValue={profile.preferred_name ?? ""} placeholder="Optional" />
      </label>

      <label className="field">
        <span>Legal name</span>
        <input name="legalName" defaultValue={profile.legal_name ?? ""} placeholder="Optional" />
      </label>

      <label className="field">
        <span>Relationship label</span>
        <input name="relationshipLabel" defaultValue={profile.relationship_label ?? ""} placeholder="Parent, sibling, neighbor..." />
      </label>

      <label className="field">
        <span>Timezone</span>
        <input
          name="timezone"
          defaultValue={profile.timezone || DEFAULT_TIMEZONE}
          placeholder={DEFAULT_TIMEZONE}
        />
        <small className="muted">Used for timeline timestamps, reminders, and notification emails. Try an IANA timezone like America/Chicago.</small>
      </label>

      <SubmitButton className="button button-primary button-full" pendingLabel="Saving...">
        Save profile
      </SubmitButton>
    </form>
  );
}
