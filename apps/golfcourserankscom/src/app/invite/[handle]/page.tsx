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
      <section className="shell-panel p-6 sm:p-8">
        <p className="eyebrow">FRIEND INVITE</p>
        <h1 className="h2 mt-4">{inviter.display_name ?? inviter.handle} wants to compare public-course lists with you</h1>
        <p className="subhed mt-4">
          Accept the invite and unlock overlap-only comparisons.
        </p>

        <InviteLanding
          handle={inviter.handle}
          inviterName={inviter.display_name ?? inviter.handle}
          viewerSignedIn={Boolean(viewer.user)}
          isSelf={viewer.user?.id === inviter.id}
          autoAccept={autoAccept}
        />

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link href={`/u/${inviter.handle}`} className="ghost-button justify-center">
            View public profile
          </Link>
          <Link href="/friends" className="ghost-button justify-center">
            Open friends
          </Link>
        </div>
      </section>
    </div>
  );
}
