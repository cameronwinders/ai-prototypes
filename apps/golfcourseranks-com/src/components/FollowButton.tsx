"use client";

import { startTransition, useState } from "react";

import { toggleFollow } from "@/app/actions";

type FollowButtonProps = {
  handle: string;
  initialFollowing: boolean;
  disabled?: boolean;
};

export function FollowButton({ handle, initialFollowing, disabled = false }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (disabled) {
    return null;
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setPending(true);
          setMessage(null);
          startTransition(async () => {
            const result = await toggleFollow(handle);
            if (!result.ok || !result.data) {
              setMessage(result.message ?? "We could not update the follow state.");
              setPending(false);
              return;
            }

            setFollowing(result.data.following);
            setMessage(result.data.following ? "Following" : "Unfollowed");
            setPending(false);
          });
        }}
        className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
      >
        {pending ? "Saving..." : following ? "Following" : "Follow golfer"}
      </button>
      {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}
