import Link from "next/link";
import { notFound } from "next/navigation";

import { InviteLanding } from "@/components/InviteLanding";
import { getProfileByHandle, logAnalyticsEvent } from "@/lib/data";
import { getViewerContext } from "@/lib/viewer";

export default async function InvitePage({
  params,
  searchParams
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { handle } = await params;
  const query = await searchParams;
  const acceptParam = query.accept;
  const autoAccept = (Array.isArray(acceptParam) ? acceptParam[0] : acceptParam) === "1";
  const inviter = await getProfileByHandle(handle);
  const viewer = await getViewerContext();

  if (!inviter) {
    notFound();
  }

  await logAnalyticsEvent({
    userId: viewer.user?.id ?? null,
    eventName: "invite_link_opened",
    payload: {
      inviter_handle: inviter.handle
    }
  });

  return (
    <div className="mx-auto max-w-3xl">
      <section className="shell-panel rounded-[2.4rem] p-6 sm:p-8">
        <p className="section-label">Friend invite</p>
        <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
          {inviter.display_name ?? inviter.handle} wants to compare public-course lists with you.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--muted)]">
          Accepting this invite keeps the social layer simple: you unlock overlap-only comparisons without exposing your full ranking history to everyone.
        </p>

        <InviteLanding
          handle={inviter.handle}
          inviterName={inviter.display_name ?? inviter.handle}
          viewerSignedIn={Boolean(viewer.user)}
          isSelf={viewer.user?.id === inviter.id}
          autoAccept={autoAccept}
        />

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link href={`/u/${inviter.handle}`} className="ghost-button min-h-11 justify-center">
            View public profile
          </Link>
          <Link href="/friends" className="ghost-button min-h-11 justify-center">
            Open friends
          </Link>
        </div>
      </section>
    </div>
  );
}
