import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { CompleteReminderForm } from "@/components/reminders/complete-reminder-form";
import { ReminderForm } from "@/components/reminders/reminder-form";
import { Card, EmptyState, SectionTitle, StatusPill } from "@/components/ui/design";
import { LocalTime } from "@/components/ui/local-time";
import { requireSpaceMembership } from "@/lib/auth/guards";
import { getProfileDisplayName } from "@/lib/domain/profiles";
import { listCompletedReminders, listUpcomingReminders } from "@/lib/domain/reminders";
import { getSpaceDashboardData } from "@/lib/domain/spaces";

type RemindersPageProps = {
  params: Promise<{ spaceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RemindersPage({ params, searchParams }: RemindersPageProps) {
  const { spaceId } = await params;
  const search = await searchParams;
  const { supabase } = await requireSpaceMembership(spaceId);
  const [{ space, subjects, eventTypes, memberships }, reminders, completedReminders] = await Promise.all([
    getSpaceDashboardData(supabase, spaceId),
    listUpcomingReminders(supabase, spaceId),
    listCompletedReminders(supabase, spaceId)
  ]);
  const success = typeof search.success === "string" ? search.success : "";
  const error = typeof search.error === "string" ? search.error : "";
  const targetedReminderId = typeof search.reminder === "string" ? search.reminder : "";
  const now = Date.now();
  const overdue = reminders.filter((reminder) => new Date(reminder.due_at).getTime() < now);
  const upcoming = reminders.filter((reminder) => new Date(reminder.due_at).getTime() >= now);

  return (
    <AppShell
      title="Reminders"
      subtitle={`Upcoming prompts for ${space.name}.`}
      actionHref={`/spaces/${spaceId}/timeline`}
      actionLabel="Dashboard"
      spaceId={spaceId}
    >
      <div className="section compact-section">
        {success ? <div className="banner success-text">{success}</div> : null}
        {error ? <div className="banner error-text">{error}</div> : null}
      </div>

      <div className="dashboard-grid section">
        <div className="section">
          <Card>
            <SectionTitle title="Create reminder" description="Set a simple prompt for later." />
            <ReminderForm
              spaceId={spaceId}
              compact
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
          </Card>
        </div>

        <div className="section">
          <Card>
            <SectionTitle title="Overdue" description="Needs attention now." />
            {overdue.length === 0 ? (
              <p className="muted">Nothing overdue.</p>
            ) : (
              <div className="mini-list">
                {overdue.map((reminder) => (
                  <div
                    className={`mini-list-row reminder-row ${targetedReminderId === reminder.id ? "is-targeted" : ""}`}
                    id={`reminder-${reminder.id}`}
                    key={reminder.id}
                  >
                    <div>
                      <span>{reminder.title}</span>
                      <p className="muted"><LocalTime value={reminder.due_at} /></p>
                    </div>
                    <div className="row-actions">
                      <StatusPill tone="warning">Overdue</StatusPill>
                      {reminder.schedule_kind !== "one_time" ? (
                        <StatusPill tone="success">{reminder.schedule_kind === "daily" ? "Daily" : "Weekly"}</StatusPill>
                      ) : null}
                      <CompleteReminderForm
                        reminderId={reminder.id}
                        spaceId={spaceId}
                        returnTo={`/spaces/${spaceId}/reminders`}
                        compact
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle title="Upcoming" description="Scheduled reminders." />
            {upcoming.length === 0 ? (
              <EmptyState title="No upcoming reminders" description="Create a reminder to prompt the team later." />
            ) : (
              <div className="mini-list">
                {upcoming.map((reminder) => (
                  <div
                    className={`mini-list-row reminder-row ${targetedReminderId === reminder.id ? "is-targeted" : ""}`}
                    id={`reminder-${reminder.id}`}
                    key={reminder.id}
                  >
                    <div>
                      <span>{reminder.title}</span>
                      <p className="muted"><LocalTime value={reminder.due_at} /></p>
                    </div>
                    <div className="row-actions">
                      <StatusPill>Upcoming</StatusPill>
                      {reminder.schedule_kind !== "one_time" ? (
                        <StatusPill tone="success">{reminder.schedule_kind === "daily" ? "Daily" : "Weekly"}</StatusPill>
                      ) : null}
                      <CompleteReminderForm
                        reminderId={reminder.id}
                        spaceId={spaceId}
                        returnTo={`/spaces/${spaceId}/reminders`}
                        compact
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle title="Completed" description="Recently finished reminders." />
            {completedReminders.length === 0 ? (
              <p className="muted">No completed reminders yet.</p>
            ) : (
              <div className="mini-list">
                {completedReminders.map((reminder) => (
                  <div
                    className={`mini-list-row reminder-row is-completed ${targetedReminderId === reminder.id ? "is-targeted" : ""}`}
                    id={`reminder-${reminder.id}`}
                    key={reminder.id}
                  >
                    <div>
                      <span>{reminder.title}</span>
                      <p className="muted">
                        Completed {reminder.completed_at ? <LocalTime value={reminder.completed_at} /> : ""}
                      </p>
                    </div>
                    <div className="row-actions">
                      {reminder.schedule_kind !== "one_time" ? (
                        <StatusPill tone="success">{reminder.schedule_kind === "daily" ? "Daily" : "Weekly"}</StatusPill>
                      ) : null}
                      <StatusPill tone="success">Completed</StatusPill>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Link className="button button-secondary button-full" href={`/spaces/${spaceId}/timeline`}>
            Back to dashboard
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
