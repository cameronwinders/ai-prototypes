import { completeReminder } from "@/actions/reminders";
import { SubmitButton } from "@/components/ui/submit-button";

type CompleteReminderFormProps = {
  reminderId: string;
  spaceId: string;
  returnTo: string;
  compact?: boolean;
};

export function CompleteReminderForm({ reminderId, spaceId, returnTo, compact = false }: CompleteReminderFormProps) {
  return (
    <form action={completeReminder}>
      <input type="hidden" name="reminderId" value={reminderId} />
      <input type="hidden" name="spaceId" value={spaceId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <SubmitButton className={compact ? "button button-secondary button-small" : "button button-secondary"} pendingLabel="Completing...">
        Mark complete
      </SubmitButton>
    </form>
  );
}
