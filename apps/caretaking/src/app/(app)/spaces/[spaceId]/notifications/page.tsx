import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { EmailPreferencesForm } from "@/components/notifications/email-preferences-form";
import { NotificationList } from "@/components/notifications/notification-list";
import { Card, StatCard } from "@/components/ui/design";
import { requireSpaceMembership } from "@/lib/auth/guards";
import { getUserProfile } from "@/lib/domain/profiles";
import {
  getEmailNotificationPreference,
  getUnreadNotificationCount,
  listNotifications
} from "@/lib/domain/notifications";

type NotificationsPageProps = {
  params: Promise<{ spaceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NotificationsPage({ params, searchParams }: NotificationsPageProps) {
  const { spaceId } = await params;
  const search = await searchParams;
  const { supabase, user } = await requireSpaceMembership(spaceId);
  const [notifications, unreadCount, emailPreference, profile] = await Promise.all([
    listNotifications(supabase, user.id, spaceId),
    getUnreadNotificationCount(supabase, user.id, spaceId),
    getEmailNotificationPreference(supabase, user.id, spaceId),
    getUserProfile(supabase, user.id)
  ]);
  const success = typeof search.success === "string" ? search.success : "";
  const error = typeof search.error === "string" ? search.error : "";

  return (
    <AppShell
      title="Notifications"
      subtitle="Shared updates that need your attention."
      actionHref={`/spaces/${spaceId}/timeline`}
      actionLabel="Dashboard"
      spaceId={spaceId}
    >
      <div className="section">
        {success ? <div className="banner success-text">{success}</div> : null}
        {error ? <div className="banner error-text">{error}</div> : null}
        <div className="stat-grid">
          <StatCard label="Unread" value={unreadCount} tone={unreadCount > 0 ? "alert" : "neutral"} />
          <StatCard label="Total" value={notifications.length} />
        </div>
        <Card>
          <div className="card-head-row">
            <div>
              <p className="eyebrow">Notifications</p>
              <h2>Recent updates</h2>
            </div>
            <Link className="text-link" href={`/spaces/${spaceId}/reminders`}>
              Reminders
            </Link>
          </div>
          <NotificationList items={notifications} spaceId={spaceId} timezone={profile.timezone} />
        </Card>
        <Card>
          <div className="section-title">
            <p className="eyebrow">Email settings</p>
            <h2>Control email volume</h2>
            <p className="muted">These preferences apply only to this care space and only to emails sent to you.</p>
          </div>
          <EmailPreferencesForm spaceId={spaceId} preference={emailPreference} />
        </Card>
      </div>
    </AppShell>
  );
}
