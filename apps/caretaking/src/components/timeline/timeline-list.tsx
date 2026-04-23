"use client";

import { EmptyState, StatusPill } from "@/components/ui/design";
import { CareIcon } from "@/components/ui/care-icon";
import { getProfileDisplayName } from "@/lib/domain/profiles";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function getDateKey(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));
}

function formatDateSeparator(value: string) {
  const date = new Date(value);
  const today = getDateKey(new Date().toISOString());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = getDateKey(yesterdayDate.toISOString());
  const key = getDateKey(value);

  if (key === today) {
    return "Today";
  }

  if (key === yesterday) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(date);
}

type TimelineItem = {
  id: string;
  occurred_at: string;
  summary: string | null;
  details: unknown;
  event_types: { name: string | null; icon: string | null; color: string | null } | null;
  subjects: { name: string | null } | null;
  profiles: { display_name: string | null; preferred_name?: string | null } | null;
};

export function TimelineList({
  items,
  actionHref
}: {
  items: TimelineItem[];
  actionHref?: string;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Start the care log"
        description="Log the first update so everyone has a shared source of truth for what happened."
        actionHref={actionHref}
        actionLabel="Log first event"
      />
    );
  }

  return (
    <section className="timeline-list">
      {items.map((item, index) => {
        const previous = items[index - 1];
        const startsNewDate = !previous || getDateKey(previous.occurred_at) !== getDateKey(item.occurred_at);

        return (
          <div className="timeline-group" key={item.id}>
            {startsNewDate ? <div className="timeline-date-separator">{formatDateSeparator(item.occurred_at)}</div> : null}
            <article className="timeline-card">
              <div className="timeline-icon" style={{ background: item.event_types?.color ?? undefined }}>
                <CareIcon icon={item.event_types?.icon} label={item.event_types?.name} />
              </div>
              <div className="timeline-card-top">
                <div>
                  <StatusPill>{item.event_types?.name ?? "Event"}</StatusPill>
                  <h3>{item.summary || "No summary provided"}</h3>
                </div>
                <p className="timeline-time">{formatDateTime(item.occurred_at)}</p>
              </div>
              <div className="timeline-meta">
                <span>{item.subjects?.name ?? "Shared subject"}</span>
                <span>{getProfileDisplayName(item.profiles, "Caregiver")}</span>
              </div>
            </article>
          </div>
        );
      })}
    </section>
  );
}
