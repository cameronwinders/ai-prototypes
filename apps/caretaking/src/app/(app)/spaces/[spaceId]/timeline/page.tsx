import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { CompleteReminderForm } from "@/components/reminders/complete-reminder-form";
import { InviteMemberForm } from "@/components/spaces/invite-member-form";
import { TimelineList } from "@/components/timeline/timeline-list";
import { Card, SectionTitle, StatCard, StatusPill } from "@/components/ui/design";
import { requireSpaceMembership } from "@/lib/auth/guards";
import { listTimelineItems } from "@/lib/domain/events";
import { getUnreadNotificationCount } from "@/lib/domain/notifications";
import { listUpcomingReminders } from "@/lib/domain/reminders";
import { getProfileDisplayName } from "@/lib/domain/profiles";
import { getSpaceDashboardData } from "@/lib/domain/spaces";

type TimelinePageProps = {
  params: Promise<{ spaceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TimelinePage({ params, searchParams }: TimelinePageProps) {
  const { spaceId } = await params;
  const search = await searchParams;
  const { supabase, membership, user } = await requireSpaceMembership(spaceId);
  const [{ space, memberships, invites }, timeline, unreadCount, reminders] = await Promise.all([
    getSpaceDashboardData(supabase, spaceId),
    listTimelineItems({ client: supabase, spaceId }),
    getUnreadNotificationCount(supabase, user.id, spaceId),
    listUpcomingReminders(supabase, spaceId)
  ]);

  const success = typeof search.success === "string" ? search.success : "";
  const error = typeof search.error === "string" ? search.error : "";
  const overdueCount = reminders.filter((reminder) => new Date(reminder.due_at).getTime() < Date.now()).length;
  const roleKey =
    membership.roles && typeof membership.roles === "object" && "key" in membership.roles
      ? String(membership.roles.key)
      : "";

  return (
    <AppShell
      title={space.name}
      subtitle="Log updates, review recent activity, and keep the care team aligned."
      actionHref={`/spaces/${spaceId}/events/new`}
      actionLabel="Log event"
      actionVariant="primary"
      spaceId={spaceId}
    >
      <div className="section compact-section">
        {success ? <div className="banner success-text">{success}</div> : null}
        {error ? <div className="banner error-text">{error}</div> : null}
      </div>

      <div className="dashboard-grid section">
        <div className="section">
          <div className="activity-header">
            <div className="dashboard-section-head">
              <SectionTitle title="Latest activity" description="Newest shared caregiving events." />
            </div>
            <section className="stat-grid stat-grid-compact" aria-label="Dashboard summary">
              <StatCard label="Events" value={timeline.length} tone="accent" href={`/spaces/${spaceId}/timeline`} />
              <StatCard
                label="Unread"
                value={unreadCount}
                tone={unreadCount > 0 ? "alert" : "neutral"}
                href={`/spaces/${spaceId}/notifications`}
              />
              <StatCard
                label="Due"
                value={overdueCount}
                tone={overdueCount > 0 ? "alert" : "neutral"}
                href={`/spaces/${spaceId}/reminders`}
              />
            </section>
          </div>
          <TimelineList items={timeline} actionHref={`/spaces/${spaceId}/events/new`} />
        </div>

        <aside className="side-rail">
          <Card className="rail-card rail-reminders">
            <div className="card-head-row">
              <SectionTitle title="Today and reminders" description="What may need attention next." />
              <Link className="text-link" href={`/spaces/${spaceId}/reminders`}>
                Open
              </Link>
            </div>
            {reminders.length === 0 ? (
              <p className="muted">No reminders scheduled yet.</p>
            ) : (
              <div className="mini-list">
                {reminders.map((reminder) => (
                  <div className="mini-list-row reminder-row" key={reminder.id}>
                    <span>{reminder.title}</span>
                    <div className="row-actions">
                      <StatusPill tone={new Date(reminder.due_at).getTime() < Date.now() ? "warning" : "neutral"}>
                        {new Date(reminder.due_at).getTime() < Date.now() ? "Overdue" : "Upcoming"}
                      </StatusPill>
                      {reminder.schedule_kind !== "one_time" ? (
                        <StatusPill tone="success">{reminder.schedule_kind === "daily" ? "Daily" : "Weekly"}</StatusPill>
                      ) : null}
                      <CompleteReminderForm
                        reminderId={reminder.id}
                        spaceId={spaceId}
                        returnTo={`/spaces/${spaceId}/timeline`}
                        compact
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="rail-card">
            <div className="card-head-row">
              <SectionTitle title="Care team" description="Roles and access at a glance." />
              <Link className="text-link" href={`/spaces/${spaceId}/members`}>
                Manage
              </Link>
            </div>
            <div className="chip-list">
              {memberships.map((member) => (
                <span className="chip" key={member.id}>
                  {getProfileDisplayName(member.profiles, "Caregiver")}
                  <small>{member.profiles?.relationship_label || member.roles?.name || "Member"}</small>
                </span>
              ))}
            </div>
          </Card>

          {roleKey === "owner" ? (
            <Card className="rail-card mini-invite-card">
              <SectionTitle title="Invite caregiver" description="Send secure access by email." />
              <InviteMemberForm spaceId={spaceId} compact />
            </Card>
          ) : null}

          {invites.length > 0 ? (
            <Card className="rail-card">
              <SectionTitle title="Pending invites" description="Waiting for these caregivers to join." />
              <div className="chip-list">
                {invites.map((invite) => (
                  <span className="chip" key={invite.id}>
                    {invite.email}
                  </span>
                ))}
              </div>
            </Card>
          ) : null}
        </aside>
      </div>
    </AppShell>
  );
}
