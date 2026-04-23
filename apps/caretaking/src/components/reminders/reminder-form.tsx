import { createReminder } from "@/actions/reminders";
import { SubmitButton } from "@/components/ui/submit-button";
import { LocalDateTimeInput } from "@/components/ui/local-date-time-input";

type ReminderFormProps = {
  spaceId: string;
  subjects: Array<{ id: string; name: string; is_primary: boolean }>;
  eventTypes: Array<{ id: string; name: string }>;
  members: Array<{ id: string; displayName: string }>;
  error?: string;
  compact?: boolean;
};

export function ReminderForm({ spaceId, subjects, eventTypes, members, error, compact = false }: ReminderFormProps) {
  return (
    <form className={compact ? "inline-form" : "stack-card"} action={createReminder}>
      <input type="hidden" name="spaceId" value={spaceId} />
      <input type="hidden" name="eventTypeId" value="" />
      <input type="hidden" name="payloadJson" value="{}" />
      {!compact ? (
        <div className="section-header">
          <h2>Create reminder</h2>
          <p className="muted">Set a one-time prompt for the care team.</p>
        </div>
      ) : null}

      <label className="field">
        <span>Title</span>
        <input name="title" placeholder="Follow up later" required />
      </label>

      <label className="field">
        <span>Due at</span>
        <LocalDateTimeInput name="dueAt" defaultOffsetMinutes={60} required />
      </label>

      <label className="field">
        <span>Repeat</span>
        <select name="scheduleKind" defaultValue="one_time">
          <option value="one_time">Does not repeat</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </label>

      <label className="field">
        <span>Subject</span>
        <select name="subjectId" defaultValue={subjects.find((subject) => subject.is_primary)?.id ?? ""}>
          <option value="">No subject</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Assign to</span>
        <select name="assignedTo" defaultValue="">
          <option value="">Notify all caregivers when due</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.displayName}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Notes</span>
        <textarea name="notes" rows={3} placeholder="What should happen when this reminder comes due?" />
      </label>

      {error ? <p className="error-text">{error}</p> : null}
      <SubmitButton className="button button-primary button-full" pendingLabel="Saving...">
        Save reminder
      </SubmitButton>
    </form>
  );
}
