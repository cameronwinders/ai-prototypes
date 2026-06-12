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
  alreadyConnected?: boolean;
};

export function InviteLanding({
  handle,
  inviterName,
  viewerSignedIn,
  isSelf,
  autoAccept,
  alreadyConnected = false
}: InviteLandingProps) {
  const [pending, setPending] = useState(autoAccept);
  const [status, setStatus] = useState<string | null>(null);
  const [connected, setConnected] = useState(alreadyConnected);

  useEffect(() => {
    if (!autoAccept || !viewerSignedIn || isSelf || alreadyConnected) {
      return;
    }

    let active = true;

    async function run() {
      const result = await acceptInviteFromHandle(handle);
      if (!active) {
        return;
      }
      setPending(false);
      if (result.ok) {
        setConnected(true);
      }
      setStatus(result.message ?? (result.ok ? "Connection saved." : "We could not finish that invite."));
    }

    void run();

    return () => {
      active = false;
    };
  }, [alreadyConnected, autoAccept, handle, isSelf, viewerSignedIn]);

  if (!viewerSignedIn) {
    return (
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/sign-in?next=${encodeURIComponent(`/invite/${handle}?accept=1`)}`} className="solid-button min-h-11">
          Sign in or create account to compare
        </Link>
        <Link href="/rankings" className="ghost-button min-h-11">
          Explore rankings first
        </Link>
      </div>
    );
  }

  if (isSelf) {
    return (
      <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--line)] bg-white px-4 py-4 text-sm leading-7 text-[var(--muted)]">
        This is your invite link. Share it with golf friends so they can connect to your profile in one tap.
      </div>
    );
  }

  if (connected) {
    return (
      <div className="mt-6 space-y-3">
        <div className="rounded-[var(--radius-md)] border border-[var(--line)] bg-white px-4 py-4 text-sm leading-7 text-[var(--muted)]">
          You are already connected with {inviterName}. Jump straight to the overlap and compare where your rankings differ.
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={`/compare/${handle}`} className="solid-button min-h-11">
            Compare lists
          </Link>
          <Link href={`/u/${handle}`} className="ghost-button min-h-11">
            View profile
          </Link>
        </div>
        {status ? <p className="text-sm text-[var(--muted)]">{status}</p> : null}
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
          if (result.ok) {
            setConnected(true);
          }
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
