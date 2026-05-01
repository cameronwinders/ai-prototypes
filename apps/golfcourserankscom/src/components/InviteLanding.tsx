"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { acceptInviteFromHandle } from "@/app/actions";

type InviteLandingProps = {
  handle: string;
  inviterName: string;
  viewerSignedIn: boolean;
  isSelf: boolean;
  autoAccept: boolean;
};

export function InviteLanding({
  handle,
  inviterName,
  viewerSignedIn,
  isSelf,
  autoAccept
}: InviteLandingProps) {
  const [pending, setPending] = useState(autoAccept);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!autoAccept || !viewerSignedIn || isSelf) {
      return;
    }

    let active = true;

    async function run() {
      const result = await acceptInviteFromHandle(handle);
      if (!active) {
        return;
      }
      setPending(false);
      setStatus(result.message ?? (result.ok ? "Connection saved." : "We could not finish that invite."));
    }

    void run();

    return () => {
      active = false;
    };
  }, [autoAccept, handle, isSelf, viewerSignedIn]);

  if (!viewerSignedIn) {
    return (
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/sign-in?next=${encodeURIComponent(`/invite/${handle}?accept=1`)}`} className="solid-button min-h-11">
          Sign in to connect
        </Link>
        <Link href="/leaderboard" className="ghost-button min-h-11">
          Explore leaderboard first
        </Link>
      </div>
    );
  }

  if (isSelf) {
    return (
      <div className="mt-6 rounded-[1.5rem] border border-[var(--line)] bg-white/88 px-4 py-4 text-sm leading-6 text-[var(--muted)]">
        This is your invite link. Share it with golf friends so they can connect to your profile in one tap.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <button
        type="button"
        onClick={async () => {
          setPending(true);
          const result = await acceptInviteFromHandle(handle);
          setPending(false);
          setStatus(result.message ?? (result.ok ? "Connection saved." : "We could not finish that invite."));
        }}
        disabled={pending}
        className="solid-button min-h-11"
      >
        {pending ? "Connecting..." : `Add ${inviterName} as a friend`}
      </button>
      {status ? <p className="text-sm text-[var(--muted)]">{status}</p> : null}
    </div>
  );
}
