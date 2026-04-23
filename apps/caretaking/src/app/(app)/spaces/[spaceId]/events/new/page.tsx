import Link from "next/link";

import { EventForm } from "@/components/events/event-form";
import { AppShell } from "@/components/layout/app-shell";
import { requireSpaceMembership } from "@/lib/auth/guards";
import { getSpaceDashboardData } from "@/lib/domain/spaces";

type NewEventPageProps = {
  params: Promise<{ spaceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewEventPage({ params, searchParams }: NewEventPageProps) {
  const { spaceId } = await params;
  const search = await searchParams;
  const { supabase } = await requireSpaceMembership(spaceId);
  const { space, subjects, eventTypes } = await getSpaceDashboardData(supabase, spaceId);
  const error = typeof search.error === "string" ? search.error : "";

  return (
    <AppShell title="Log an event" subtitle={`Add a quick update to ${space.name}.`} spaceId={spaceId}>
      <div className="quick-log-page section">
        <Link className="button button-secondary" href={`/spaces/${spaceId}/timeline`}>
          Back to dashboard
        </Link>
        <EventForm
          error={error}
          spaceId={spaceId}
          eventTypes={eventTypes.map((eventType) => ({
            id: eventType.id,
            name: eventType.name,
            icon: eventType.icon,
            color: eventType.color
          }))}
          subjects={subjects.map((subject) => ({
            id: subject.id,
            name: subject.name,
            is_primary: subject.is_primary
          }))}
        />
      </div>
    </AppShell>
  );
}
