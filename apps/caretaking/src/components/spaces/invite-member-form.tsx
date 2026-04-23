import { inviteMember } from "@/actions/spaces";
import { SubmitButton } from "@/components/ui/submit-button";

export function InviteMemberForm({ spaceId, compact = false }: { spaceId: string; compact?: boolean }) {
  return (
    <form className={compact ? "inline-form" : "stack-card"} action={inviteMember}>
      <input type="hidden" name="spaceId" value={spaceId} />
      {!compact ? (
        <div className="section-header">
          <h2>Invite another caregiver</h2>
          <p className="muted">Invites are emailed directly and remain generic to support many caregiving workflows.</p>
        </div>
      ) : null}
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" placeholder="other.caregiver@example.com" required />
      </label>
      <label className="field">
        <span>Role</span>
        <select name="roleKey" defaultValue="caregiver">
          <option value="caregiver">Caregiver</option>
          <option value="viewer">Viewer</option>
        </select>
      </label>
      <SubmitButton className={compact ? "button button-primary button-full" : "button button-secondary"}>
        Send invite
      </SubmitButton>
    </form>
  );
}
