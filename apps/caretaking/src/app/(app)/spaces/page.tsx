import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/design";
import { listUserSpaces } from "@/lib/domain/spaces";
import { requireUser } from "@/lib/auth/guards";

export default async function SpacesPage() {
  const { supabase, user } = await requireUser();
  const spaces = await listUserSpaces(supabase, user.id);

  if (spaces.length === 1) {
    redirect(`/spaces/${spaces[0].id}/timeline`);
  }

  return (
    <AppShell
      title="Choose a space"
      subtitle="Pick the shared caregiving space you want to work in, or create a new one."
      actionHref="/spaces/new"
      actionLabel="New space"
      actionVariant="primary"
    >
      <section className="section">
        {spaces.length > 0 ? (
          <div className="space-picker-list">
            {spaces.map((space) => (
              <Link className="space-picker-card" href={`/spaces/${space.id}/timeline`} key={space.id}>
                <div>
                  <p className="eyebrow">Caregiving space</p>
                  <h2>{space.name}</h2>
                </div>
                <span aria-hidden="true">Open</span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No spaces yet"
            description="Create your first shared caregiving space to start logging events."
            actionHref="/spaces/new"
            actionLabel="Create a space"
          />
        )}
      </section>
    </AppShell>
  );
}
