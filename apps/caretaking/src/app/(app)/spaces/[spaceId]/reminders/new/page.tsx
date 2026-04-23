import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { ReminderForm } from "@/components/reminders/reminder-form";
import { requireSpaceMembership } from "@/lib/auth/guards";
import { getProfileDisplayName } from "@/lib/domain/profiles";
import { getSpaceDashboardData } from "@/lib/domain/spaces";

type NewReminderPageProps = {
  params: Promise<{ spaceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewReminderPage({ params, searchParams }: NewReminderPageProps) {
  const { spaceId } = await params;
  const search = await searchParams;
  const { supabase } = await requireSpaceMembership(spaceId);
  const { space, subjects, eventTypes, memberships } = await getSpaceDashboardData(supabase, spaceId);
  const error = typeof search.error === "string" ? search.error : "";

  return (
    <AppShell title="Create reminder" subtitle={`Schedule a future prompt for ${space.name}.`} spaceId={spaceId}>
      <div className="section">
        <Link className="button button-secondary" href={`/spaces/${spaceId}/reminders`}>
          Back to reminders
        </Link>
        <ReminderForm
          spaceId={spaceId}
          error={error}
          subjects={subjects.map((subject) => ({
            id: subject.id,
            name: subject.name,
            is_primary: subject.is_primary
          }))}
          eventTypes={eventTypes.map((eventType) => ({
            id: eventType.id,
            name: eventType.name
          }))}
          members={memberships.map((member) => ({
            id: member.user_id,
            displayName: getProfileDisplayName(member.profiles, "Caregiver")
          }))}
        />
      </div>
    </AppShell>
  );
}
