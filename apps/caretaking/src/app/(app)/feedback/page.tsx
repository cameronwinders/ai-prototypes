import { cookies } from "next/headers";

import { FeedbackForm } from "@/components/feedback/feedback-form";
import { FeedbackHistory } from "@/components/feedback/feedback-history";
import { AppShell } from "@/components/layout/app-shell";
import { Card, SectionTitle } from "@/components/ui/design";
import { requireUser } from "@/lib/auth/guards";
import { listFeedbackSubmissions } from "@/lib/domain/feedback";
import { getLastSpaceId, resolvePreferredSpaceId } from "@/lib/domain/space-preferences";
import { listUserSpaces } from "@/lib/domain/spaces";

type FeedbackPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FeedbackPage({ searchParams }: FeedbackPageProps) {
  const params = await searchParams;
  const { supabase, user } = await requireUser();
  const [spaces, submissions] = await Promise.all([listUserSpaces(supabase, user.id), listFeedbackSubmissions(supabase, user.id)]);
  const success = typeof params.success === "string" ? params.success : "";
  const error = typeof params.error === "string" ? params.error : "";
  const cookieStore = await cookies();
  const preferredSpaceId = resolvePreferredSpaceId(spaces, getLastSpaceId(cookieStore));
  const preferredSpace = spaces.find((space) => space.id === preferredSpaceId) ?? null;

  return (
    <AppShell
      title="Submit feedback"
      subtitle="Share bugs, feature requests, or product friction so we can turn real caregiver input into improvements."
      actionHref={preferredSpace ? `/spaces/${preferredSpace.id}/timeline` : "/spaces"}
      actionLabel={preferredSpace ? "Back to timeline" : "Spaces"}
    >
      <div className="section compact-section">
        {success ? <div className="banner success-text">{success}</div> : null}
        {error ? <div className="banner error-text">{error}</div> : null}
      </div>

      <div className="dashboard-grid section">
        <FeedbackForm error={error} />
        <div className="section">
          <Card>
            <SectionTitle
              title="What we capture"
              description="Each submission stores your user identity, current route, timestamp, space context, type, severity, and review status."
            />
            <div className="chip-list">
              <span className="chip">
                Structured records
                <small>Stored for repeated review</small>
              </span>
              <span className="chip">
                Route context
                <small>Captured automatically</small>
              </span>
              <span className="chip">
                Follow-up option
                <small>Only if you allow it</small>
              </span>
            </div>
          </Card>
          <FeedbackHistory items={submissions} />
        </div>
      </div>
    </AppShell>
  );
}
