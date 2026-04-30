import { markNotificationAsRead } from "@/actions/notifications";
import { SubmitButton } from "@/components/ui/submit-button";
import { EmptyState, StatusPill } from "@/components/ui/design";
import type { NotificationListItem } from "@/lib/domain/notifications";
import Link from "next/link";
import { LocalTime } from "@/components/ui/local-time";

export function NotificationList({
  items,
  spaceId,
  timezone
}: {
  items: NotificationListItem[];
  spaceId: string;
  timezone: string;
}) {
  if (items.length === 0) {
    return (
      <EmptyState title="No notifications yet" description="New event and reminder activity will appear here." />
    );
  }

  return (
    <section className="notification-list">
      {items.map((item) => (
        <article className={item.status === "read" ? "notification-card is-read" : "notification-card"} key={item.id}>
          <div className="notification-main">
            <div>
              <StatusPill tone={item.status === "read" ? "neutral" : "success"}>
                {item.status === "read" ? "Read" : "Unread"}
              </StatusPill>
              <h3>{item.title}</h3>
              {item.body ? <p className="muted">{item.body}</p> : null}
            </div>
            <p className="timeline-time">
              {item.display_label} <LocalTime value={item.display_at} timezone={timezone} />
            </p>
          </div>
          {item.status !== "read" ? (
            <form action={markNotificationAsRead} className="notification-action">
              <input type="hidden" name="notificationId" value={item.id} />
              <input type="hidden" name="spaceId" value={spaceId} />
              <SubmitButton className="button button-secondary">Mark as read</SubmitButton>
            </form>
          ) : null}
          <Link
            className="text-link"
            href={
              item.reminder_id
                ? `/spaces/${spaceId}/reminders?reminder=${item.reminder_id}#reminder-${item.reminder_id}`
                : `/spaces/${spaceId}/timeline`
            }
          >
            View {item.reminder_id ? "reminder" : "timeline"}
          </Link>
        </article>
      ))}
    </section>
  );
}
