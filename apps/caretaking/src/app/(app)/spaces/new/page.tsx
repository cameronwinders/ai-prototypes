import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { CreateSpaceForm } from "@/components/spaces/create-space-form";

type NewSpacePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewSpacePage({ searchParams }: NewSpacePageProps) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <AppShell
      title="Create a shared space"
      subtitle="A space groups caregivers, subjects, events, reminders, and notifications."
      actionHref="/spaces"
      actionLabel="Back to spaces"
    >
      <section className="section form-page">
        <CreateSpaceForm error={error} />
        <Link className="text-link" href="/spaces">
          Cancel and return to spaces
        </Link>
      </section>
    </AppShell>
  );
}
