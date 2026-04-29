import { LocalTime } from "@/components/ui/local-time";
import { Card, EmptyState, SectionTitle, StatusPill } from "@/components/ui/design";
import type { FeedbackSubmissionRecord } from "@/lib/domain/feedback";

function formatFeedbackType(type: FeedbackSubmissionRecord["type"]) {
  switch (type) {
    case "bug":
      return "Bug";
    case "feature_request":
      return "Feature request";
    default:
      return "General feedback";
  }
}

function getStatusTone(status: FeedbackSubmissionRecord["status"]) {
  switch (status) {
    case "planned":
      return "success";
    case "closed":
      return "neutral";
    case "reviewing":
      return "warning";
    default:
      return "neutral";
  }
}

export function FeedbackHistory({ items }: { items: FeedbackSubmissionRecord[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <EmptyState
          title="No feedback submitted yet"
          description="When you share product input here, we'll keep a clean record so improvements are easier to review and act on."
        />
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle
        title="Your recent submissions"
        description="A lightweight history of the product issues, requests, and notes you've shared."
      />
      <div className="mini-list">
        {items.map((item) => (
          <div className="mini-list-row feedback-history-row" key={item.id}>
            <div className="feedback-history-main">
              <strong>{item.subject}</strong>
              <p className="muted">
                {formatFeedbackType(item.type)}
                {item.spaces?.name ? ` - ${item.spaces.name}` : ""}
                {item.severity ? ` - ${item.severity}` : ""}
              </p>
              <p className="muted feedback-history-route">{item.route}</p>
              {item.description ? <p>{item.description}</p> : null}
            </div>
            <div className="feedback-history-meta">
              <StatusPill tone={getStatusTone(item.status)}>{item.status.replace("_", " ")}</StatusPill>
              <small className="muted">
                <LocalTime value={item.created_at} />
              </small>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
