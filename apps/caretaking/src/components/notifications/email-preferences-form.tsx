import { saveEmailNotificationPreferences } from "@/actions/notification-preferences";
import { SubmitButton } from "@/components/ui/submit-button";
import type { EmailNotificationPreference } from "@/lib/domain/notifications";

type EmailPreferencesFormProps = {
  spaceId: string;
  preference: EmailNotificationPreference;
};

export function EmailPreferencesForm({ spaceId, preference }: EmailPreferencesFormProps) {
  return (
    <form action={saveEmailNotificationPreferences} className="settings-form">
      <input type="hidden" name="spaceId" value={spaceId} />
      <div className="setting-row">
        <div>
          <p className="setting-title">Email notifications</p>
          <p className="muted">Turn all transactional emails for this care space on or off.</p>
        </div>
        <label className="toggle-label">
          <input name="emailNotificationsEnabled" type="checkbox" defaultChecked={preference.enabled} />
          <span>On</span>
        </label>
      </div>
      <label className="field-label" htmlFor="actionLogEmailLevel">
        Logged action emails
      </label>
      <select
        className="input"
        id="actionLogEmailLevel"
        name="actionLogEmailLevel"
        defaultValue={preference.action_log_email_level}
      >
        <option value="important_only">Important only</option>
        <option value="all">All logged actions</option>
        <option value="off">Off</option>
      </select>
      <p className="form-help">Important actions use the event type&apos;s default notification setting.</p>
      <div className="setting-row">
        <div>
          <p className="setting-title">Reminder completion emails</p>
          <p className="muted">Email me when another caregiver completes a reminder in this care space.</p>
        </div>
        <label className="toggle-label">
          <input
            name="reminderCompletionEmailEnabled"
            type="checkbox"
            defaultChecked={preference.reminder_completion_email_enabled}
          />
          <span>On</span>
        </label>
      </div>
      <SubmitButton className="button button-primary" pendingLabel="Saving...">
        Save email settings
      </SubmitButton>
    </form>
  );
}
