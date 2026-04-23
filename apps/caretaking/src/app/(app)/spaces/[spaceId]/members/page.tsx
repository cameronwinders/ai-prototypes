import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { InviteMemberForm } from "@/components/spaces/invite-member-form";
import { Card, SectionTitle, StatusPill } from "@/components/ui/design";
import { requireSpaceMembership } from "@/lib/auth/guards";
import { getProfileDisplayName } from "@/lib/domain/profiles";
import { getSpaceDashboardData } from "@/lib/domain/spaces";

type MembersPageProps = {
  params: Promise<{ spaceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MembersPage({ params, searchParams }: MembersPageProps) {
  const { spaceId } = await params;
  const search = await searchParams;
  const { supabase, membership } = await requireSpaceMembership(spaceId);
  const { space, memberships, invites } = await getSpaceDashboardData(supabase, spaceId);
  const success = typeof search.success === "string" ? search.success : "";
  const error = typeof search.error === "string" ? search.error : "";
  const roleKey =
    membership.roles && typeof membership.roles === "object" && "key" in membership.roles
      ? String(membership.roles.key)
      : "";

  return (
    <AppShell
      title="Members and access"
      subtitle={`Manage who can view and log events in ${space.name}.`}
      actionHref={`/spaces/${spaceId}/timeline`}
      actionLabel="Dashboard"
      spaceId={spaceId}
    >
      <div className="section compact-section">
        {success ? <div className="banner success-text">{success}</div> : null}
        {error ? <div className="banner error-text">{error}</div> : null}
      </div>

      <div className="dashboard-grid section">
        <Card>
          <SectionTitle title="Care team" description="Active caregivers and their access level." />
          <div className="member-list">
            {memberships.map((member) => (
              <div className="member-row" key={member.id}>
                <div className="avatar-mark" aria-hidden="true">
                  {getProfileDisplayName(member.profiles, "C").slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <strong>{getProfileDisplayName(member.profiles, "Caregiver")}</strong>
                  <p className="muted">{member.profiles?.relationship_label || member.roles?.name || "Member"}</p>
                </div>
                <StatusPill tone="success">Active</StatusPill>
              </div>
            ))}
          </div>
        </Card>

        <div className="section">
          <Card>
            <SectionTitle
              title="Invite caregiver"
              description={
                roleKey === "owner"
                  ? "Send an email invite with the right role."
                  : "Only owners can invite new caregivers. Ask the space owner to invite caregivers."
              }
            />
            {roleKey === "owner" ? <InviteMemberForm spaceId={spaceId} compact /> : null}
          </Card>

          <Card>
            <SectionTitle title="Pending invites" description="Invites expire automatically if unused." />
            {invites.length === 0 ? (
              <p className="muted">No pending invites.</p>
            ) : (
              <div className="mini-list">
                {invites.map((invite) => (
                  <div className="mini-list-row" key={invite.id}>
                    <span>{invite.email}</span>
                    <StatusPill tone="warning">{invite.roles?.name ?? "Pending"}</StatusPill>
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
