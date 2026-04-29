import Link from "next/link";

import { updateFeedbackStatus } from "@/actions/feedback";
import { AppShell } from "@/components/layout/app-shell";
import { LocalTime } from "@/components/ui/local-time";
import { Card, EmptyState, SectionTitle, StatCard, StatusPill } from "@/components/ui/design";
import { requireFeedbackReviewer } from "@/lib/auth/feedback-reviewers";
import { listFeedbackSubmissionsForReview, type FeedbackReviewRecord } from "@/lib/domain/feedback";
import { getProfileDisplayName } from "@/lib/domain/profiles";
import { createAdminClient } from "@/lib/supabase/admin";

type FeedbackReviewPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const statusOptions: Array<FeedbackReviewRecord["status"] | "all"> = ["all", "new", "reviewing", "planned", "closed"];

function getStatusTone(status: FeedbackReviewRecord["status"]) {
  switch (status) {
    case "planned":
      return "success";
    case "closed":
      return "neutral";
    case "reviewing":
      return "warning";
    default:
      return "danger";
  }
}

function formatFeedbackType(type: FeedbackReviewRecord["type"]) {
  switch (type) {
    case "bug":
      return "Bug";
    case "feature_request":
      return "Feature request";
    default:
      return "General feedback";
  }
}

export default async function FeedbackReviewPage({ searchParams }: FeedbackReviewPageProps) {
  const params = await searchParams;
  await requireFeedbackReviewer();
  const admin = createAdminClient();
  const selectedStatus = typeof params.status === "string" && statusOptions.includes(params.status as FeedbackReviewRecord["status"] | "all")
    ? (params.status as FeedbackReviewRecord["status"] | "all")
    : "all";
  const [items, allItems] = await Promise.all([
    listFeedbackSubmissionsForReview(admin, { status: selectedStatus, limit: 100 }),
    listFeedbackSubmissionsForReview(admin, { status: "all", limit: 200 })
  ]);
  const success = typeof params.success === "string" ? params.success : "";
  const error = typeof params.error === "string" ? params.error : "";
  const counts = {
    all: allItems.length,
    new: allItems.filter((item) => item.status === "new").length,
    reviewing: allItems.filter((item) => item.status === "reviewing").length,
    planned: allItems.filter((item) => item.status === "planned").length,
    closed: allItems.filter((item) => item.status === "closed").length
  };

  return (
    <AppShell
      title="Feedback review"
      subtitle="Triage incoming product input, keep statuses current, and export structured records when you need a batch review."
      actionHref="/api/feedback/export"
      actionLabel="Export JSON"
    >
      <div className="section compact-section">
        {success ? <div className="banner success-text">{success}</div> : null}
        {error ? <div className="banner error-text">{error}</div> : null}
      </div>

      <div className="section">
        <div className="stat-grid">
          <StatCard label="All" value={counts.all} tone="neutral" href="/feedback/review?status=all" />
          <StatCard label="New" value={counts.new} tone={counts.new > 0 ? "alert" : "neutral"} href="/feedback/review?status=new" />
          <StatCard label="Reviewing" value={counts.reviewing} tone={counts.reviewing > 0 ? "accent" : "neutral"} href="/feedback/review?status=reviewing" />
          <StatCard label="Planned" value={counts.planned} tone="accent" href="/feedback/review?status=planned" />
          <StatCard label="Closed" value={counts.closed} tone="neutral" href="/feedback/review?status=closed" />
        </div>
      </div>

      <div className="section">
        <Card>
          <div className="card-head-row">
            <SectionTitle
              title="Internal triage queue"
              description="Use the filters and status controls to keep incoming feedback moving instead of letting product input disappear into email threads."
            />
            <div className="feedback-review-actions">
              {statusOptions.map((status) => (
                <Link
                  className={`filter-chip ${selectedStatus === status ? "is-active" : ""}`}
                  href={`/feedback/review?status=${status}`}
                  key={status}
                >
                  {status === "all" ? "All statuses" : status.replace("_", " ")}
                </Link>
              ))}
            </div>
          </div>

          {items.length === 0 ? (
            <EmptyState
              title="No feedback in this filter"
              description="When product input starts coming in, it will show up here with route, space, user, and severity context."
            />
          ) : (
            <div className="mini-list feedback-review-list">
              {items.map((item) => (
                <section className="mini-list-row feedback-review-row" key={item.id}>
                  <div className="feedback-review-main">
                    <div className="feedback-review-head">
                      <strong>{item.subject}</strong>
                      <div className="chip-list">
                        <StatusPill tone={getStatusTone(item.status)}>{item.status.replace("_", " ")}</StatusPill>
                        <StatusPill tone={item.type === "bug" ? "danger" : item.type === "feature_request" ? "success" : "neutral"}>
                          {formatFeedbackType(item.type)}
                        </StatusPill>
                        {item.severity ? <StatusPill tone="warning">{item.severity}</StatusPill> : null}
                      </div>
                    </div>
                    <p className="muted">
                      {getProfileDisplayName(item.profiles, "Caregiver")} · {item.profiles?.relationship_label || item.user_id}
                    </p>
                    <p className="muted">
                      {item.spaces?.name ? `${item.spaces.name} · ` : ""}
                      {item.route}
                    </p>
                    {item.description ? <p>{item.description}</p> : null}
                    <div className="feedback-review-meta">
                      <small className="muted">
                        Submitted <LocalTime value={item.created_at} />
                      </small>
                      <small className="muted">{item.contact_allowed ? "Follow-up allowed" : "No follow-up requested"}</small>
                    </div>
                  </div>

                  <form action={updateFeedbackStatus} className="feedback-review-form">
                    <input name="feedbackId" type="hidden" value={item.id} />
                    <input name="statusFilter" type="hidden" value={selectedStatus} />
                    <label className="field">
                      <span>Status</span>
                      <select defaultValue={item.status} name="status">
                        <option value="new">New</option>
                        <option value="reviewing">Reviewing</option>
                        <option value="planned">Planned</option>
                        <option value="closed">Closed</option>
                      </select>
                    </label>
                    <button className="button button-secondary" type="submit">
                      Save
                    </button>
                  </form>
                </section>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
