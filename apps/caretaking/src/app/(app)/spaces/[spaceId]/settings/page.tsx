import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { Card, SectionTitle, StatCard } from "@/components/ui/design";
import { requireSpaceMembership } from "@/lib/auth/guards";
import { getSpaceDashboardData } from "@/lib/domain/spaces";

type SpaceSettingsPageProps = {
  params: Promise<{ spaceId: string }>;
};

export default async function SpaceSettingsPage({ params }: SpaceSettingsPageProps) {
  const { spaceId } = await params;
  const { supabase } = await requireSpaceMembership(spaceId);
  const { space, memberships, invites, subjects, eventTypes } = await getSpaceDashboardData(supabase, spaceId);

  return (
    <AppShell
      title="Space settings"
      subtitle={`Understand who has access to ${space.name} and where the team can manage this space.`}
      actionHref={`/spaces/${spaceId}/timeline`}
      actionLabel="Back to timeline"
    >
      <div className="section">
        <div className="stat-grid">
          <StatCard label="Members" value={memberships.length} />
          <StatCard label="Pending invites" value={invites.length} />
          <StatCard label="Subjects" value={subjects.length} tone="accent" />
        </div>

        <div className="dashboard-grid">
          <Card>
            <SectionTitle
              title="Space overview"
              description="A quick read on the caregiving workspace and the supporting structures around it."
            />
            <div className="mini-list">
              <div className="mini-list-row">
                <span>Space name</span>
                <strong>{space.name}</strong>
              </div>
              <div className="mini-list-row">
                <span>Event types</span>
                <strong>{eventTypes.length}</strong>
              </div>
              <div className="mini-list-row">
                <span>Subjects being tracked</span>
                <strong>{subjects.length}</strong>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle
              title="Management shortcuts"
              description="The most natural places to adjust people, workflow, and follow-up in this space."
            />
            <div className="space-picker-list">
              <Link className="space-picker-card" href={`/spaces/${spaceId}/members`}>
                <div>
                  <p className="eyebrow">People and access</p>
                  <h2>Members</h2>
                </div>
                <span>Open</span>
              </Link>
              <Link className="space-picker-card" href={`/spaces/${spaceId}/notifications`}>
                <div>
                  <p className="eyebrow">Delivery preferences</p>
                  <h2>Notifications</h2>
                </div>
                <span>Open</span>
              </Link>
              <Link className="space-picker-card" href="/feedback">
                <div>
                  <p className="eyebrow">Product input</p>
                  <h2>Submit feedback</h2>
                </div>
                <span>Open</span>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
