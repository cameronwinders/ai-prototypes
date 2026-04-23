import { createEvent } from "@/actions/events";
import { SubmitButton } from "@/components/ui/submit-button";
import { CareIcon } from "@/components/ui/care-icon";
import { LocalDateTimeInput } from "@/components/ui/local-date-time-input";

type EventFormProps = {
  spaceId: string;
  eventTypes: Array<{ id: string; name: string; icon: string | null; color: string | null }>;
  subjects: Array<{ id: string; name: string; is_primary: boolean }>;
  error?: string;
};

export function EventForm({ spaceId, eventTypes, subjects, error }: EventFormProps) {
  return (
    <form className="quick-log-sheet" action={createEvent}>
      <input type="hidden" name="spaceId" value={spaceId} />
      <input type="hidden" name="detailsJson" value="{}" />
      <div className="sheet-handle" aria-hidden="true" />
      <div className="quick-log-head">
        <div>
          <p className="eyebrow">Quick log</p>
          <h2>What happened?</h2>
        </div>
        <span className="status-pill status-pill-success">Now</span>
      </div>

      <fieldset className="event-type-grid">
        <legend>Event type</legend>
        {eventTypes.map((eventType, index) => (
          <label className="event-type-option" key={eventType.id}>
            <input
              type="radio"
              name="eventTypeId"
              value={eventType.id}
              defaultChecked={index === 0}
              required
            />
            <span className="event-type-icon" style={{ background: eventType.color ?? undefined }}>
              <CareIcon icon={eventType.icon} label={eventType.name} />
            </span>
            <strong>{eventType.name}</strong>
          </label>
        ))}
      </fieldset>

      <div className="form-grid-2">
        <label className="field">
          <span>Subject</span>
          <select name="subjectId" defaultValue={subjects.find((subject) => subject.is_primary)?.id ?? ""}>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Occurred at</span>
          <LocalDateTimeInput name="occurredAt" required />
        </label>
      </div>

      <label className="field">
        <span>Note</span>
        <textarea name="summary" rows={4} placeholder="Add a quick note for the other caregiver." />
      </label>

      {error ? <p className="error-text">{error}</p> : null}
      <div className="sticky-action">
        <SubmitButton className="button button-primary button-full" pendingLabel="Logging...">
          Log event
        </SubmitButton>
      </div>
    </form>
  );
}
