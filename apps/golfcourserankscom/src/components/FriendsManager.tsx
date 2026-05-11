"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { respondToFriendRequest, searchFriendProfilesAction, sendFriendRequest, sendFriendRequestToUser } from "@/app/actions";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import type { DiscoverableProfile, FriendsPageData } from "@/lib/types";

type FriendsManagerProps = {
  initialData: FriendsPageData;
  inviteUrl: string;
  viewerHandle: string;
  joinedHandle?: string | null;
  joinedName?: string | null;
};

export function FriendsManager({ initialData, inviteUrl, viewerHandle, joinedHandle, joinedName }: FriendsManagerProps) {
  const [data, setData] = useState(initialData);
  const [email, setEmail] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<DiscoverableProfile[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sharing, setSharing] = useState(false);

  const acceptedIds = useMemo(() => new Set(data.accepted.map((friend) => friend.profile.id)), [data.accepted]);

  async function trackShare(method: string) {
    try {
      await fetch("/api/analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          eventName: "share_clicked",
          payload: {
            surface: "friends-invite-link",
            method
          }
        })
      });
    } catch {
      // Ignore analytics failures here.
    }
  }

  async function handleSendEmail() {
    setSubmitting(true);
    setStatus(null);
    const result = await sendFriendRequest(email);
    setSubmitting(false);
    setStatus(result.message ?? (result.ok ? "Friend request sent." : "Something went wrong."));
    if (result.ok) {
      setEmail("");
    }
  }

  async function handleSearch() {
    setSubmitting(true);
    setStatus(null);

    try {
      const results = await searchFriendProfilesAction(search);
      setSearchResults(results);
      if (results.length === 0) {
        setStatus("No golfers matched that search yet.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleInviteRequest(profileId: string) {
    setPendingId(profileId);
    const result = await sendFriendRequestToUser(profileId);
    setPendingId(null);
    setStatus(result.message ?? (result.ok ? "Friend request sent." : "Something went wrong."));
  }

  async function handleAccept(friendshipId: string) {
    setPendingId(friendshipId);
    const result = await respondToFriendRequest(friendshipId, "accepted");
    setPendingId(null);
    setStatus(result.message ?? (result.ok ? "Request updated." : "Something went wrong."));
    if (result.ok) {
      const acceptedRequest = data.incoming.find((request) => request.id === friendshipId);
      setData((current) => ({
        accepted: acceptedRequest
          ? [
              {
                friendshipId,
                overlapCount: 0,
                rankedCount: 0,
                profile: acceptedRequest.profile
              },
              ...current.accepted
            ]
          : current.accepted,
        incoming: current.incoming.filter((request) => request.id !== friendshipId),
        outgoing: current.outgoing
      }));
    }
  }

  async function handleShareLink() {
    setSharing(true);
    setStatus(null);

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: "Golf Course Ranks invite",
          text: "Compare public-course rankings with me on Golf Course Ranks.",
          url: inviteUrl
        });
        await trackShare("native");
        setStatus("Invite link shared.");
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteUrl);
        await trackShare("clipboard");
        setStatus("Invite link copied.");
        return;
      }

      setStatus("Share is not available on this device.");
    } catch {
      setStatus("Share cancelled.");
    } finally {
      setSharing(false);
    }
  }

  async function handleCopyLink() {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(inviteUrl);
      await trackShare("copy-button");
      setStatus("Invite link copied.");
    } else {
      setStatus("Copy is not available on this device.");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <section className="space-y-6">
        {joinedHandle ? (
          <section className="shell-panel-contrast p-5">
            <p className="eyebrow">INVITE WORKED</p>
            <h2 className="h3 mt-4">{joinedName ?? `@${joinedHandle}`} joined through your invite</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              You are connected now, so the fastest next step is to compare the courses you both know.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/compare/${joinedHandle}`} className="solid-button">
                Compare lists
              </Link>
              <Link href={`/u/${joinedHandle}`} className="ghost-button">
                View profile
              </Link>
            </div>
          </section>
        ) : null}

        <section className="shell-panel-soft p-6">
          <p className="eyebrow">SHARE YOUR INVITE LINK</p>
          <h2 className="h3 mt-4">Send one link and start comparing lists</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Your personal invite route is permanent, mobile-friendly, and easy to drop into a group chat. When a golfer opens it, signs up, and finishes onboarding, you become friends automatically.
          </p>

          <div className="shell-panel-contrast mt-5 p-4">
            <p className="meta">Invite URL</p>
            <p className="mt-2 break-all text-sm font-semibold text-[var(--ink)]">{inviteUrl}</p>
          </div>

          <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
            <button type="button" onClick={handleShareLink} disabled={sharing} className="solid-button justify-center">
              {sharing ? "Inviting..." : "Invite a friend"}
            </button>
            <button type="button" onClick={handleCopyLink} className="ghost-button justify-center">
              Copy invite link
            </button>
            <Link href={`/u/${viewerHandle}`} className="ghost-button justify-center">
              Open my public profile
            </Link>
          </div>

          <div className="shell-panel-contrast mt-6 flex justify-center p-5">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(inviteUrl)}`}
              alt="QR code for your Golf Course Ranks invite link"
              width={180}
              height={180}
              className="h-[180px] w-[180px] rounded-[var(--radius-md)]"
            />
          </div>
        </section>

        <section className="shell-panel p-6">
          <p className="eyebrow">SEARCH GOLFERS</p>
          <h2 className="h3 mt-4">Find people by handle, name, or email</h2>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search handle, display name, or email"
              className="min-h-11 flex-1 rounded-[var(--radius-md)] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[rgba(49,107,83,0.45)]"
            />
            <button type="button" onClick={handleSearch} disabled={submitting} className="solid-button justify-center">
              {submitting ? "Searching..." : "Search"}
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            {searchResults.map((profile) => (
              <div key={profile.id} className="rounded-[var(--radius-md)] border border-[var(--line)] bg-white/90 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <InitialsAvatar displayName={profile.display_name} handle={profile.handle} />
                    <div>
                      <p className="h3 text-[1.15rem]">{profile.display_name ?? profile.handle}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        @{profile.handle}
                        {profile.home_state ? ` · ${profile.home_state}` : ""}
                        {profile.email ? ` · ${profile.email}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:flex sm:flex-wrap">
                    <Link href={`/u/${profile.handle}`} className="ghost-button sm">
                      View profile
                    </Link>
                    {acceptedIds.has(profile.id) ? (
                      <span className="pill pill-pine pill-sentence">Already connected</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleInviteRequest(profile.id)}
                        disabled={pendingId === profile.id}
                        className="solid-button sm"
                      >
                        {pendingId === profile.id ? "Sending..." : "Send request"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="shell-panel-contrast p-6">
          <p className="eyebrow">FALLBACK</p>
          <h2 className="h3 mt-4">Still want to invite by email?</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Keep the manual path around for golfers who have not claimed a public handle yet.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="friend@email.com"
              className="min-h-11 flex-1 rounded-[var(--radius-md)] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[rgba(49,107,83,0.45)]"
            />
            <button type="button" onClick={handleSendEmail} disabled={submitting} className="ghost-button justify-center">
              {submitting ? "Sending..." : "Send email request"}
            </button>
          </div>
        </section>

        {status ? <p className="text-sm text-[var(--muted)]">{status}</p> : null}
      </section>

      <aside className="space-y-6">
        <section className="shell-panel p-6">
          <p className="eyebrow">ACCEPTED FRIENDS</p>
          <div className="mt-4 grid gap-3">
            {data.accepted.length === 0 ? (
              <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--line)] px-4 py-6 text-sm leading-7 text-[var(--muted)]">
                No accepted friendships yet. Share your invite link or search for a golfer to unlock compare views.
              </div>
            ) : (
              data.accepted.map((friend) => (
                <div key={friend.friendshipId} className="rounded-[var(--radius-md)] border border-[var(--line)] bg-white/90 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <InitialsAvatar displayName={friend.profile.display_name} handle={friend.profile.handle} />
                      <div>
                        <p className="h3 text-[1.15rem]">{friend.profile.display_name ?? friend.profile.handle}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {friend.overlapCount} shared courses · {friend.rankedCount} ranked
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
                      <Link href={`/compare/${friend.profile.handle}`} className="solid-button sm">
                        Compare
                      </Link>
                      <Link href={`/u/${friend.profile.handle}`} className="ghost-button sm">
                        View profile
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="shell-panel-contrast p-6">
          <p className="eyebrow">INCOMING</p>
          <div className="mt-4 grid gap-3">
            {data.incoming.length === 0 ? (
              <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--line)] px-4 py-6 text-sm leading-7 text-[var(--muted)]">
                No pending requests right now.
              </div>
            ) : (
              data.incoming.map((request) => (
                <div key={request.id} className="rounded-[var(--radius-md)] border border-[var(--line)] bg-white/90 p-4">
                  <div className="flex items-center gap-3">
                    <InitialsAvatar displayName={request.profile.display_name} handle={request.profile.handle} />
                    <div>
                      <p className="h3 text-[1.15rem]">{request.profile.display_name ?? request.profile.handle}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">@{request.profile.handle}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAccept(request.id)}
                    disabled={pendingId === request.id}
                    className="solid-button mt-4"
                  >
                    {pendingId === request.id ? "Accepting..." : "Accept request"}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="shell-panel-contrast p-6">
          <p className="eyebrow">OUTGOING</p>
          <div className="mt-4 grid gap-3">
            {data.outgoing.length === 0 ? (
              <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--line)] px-4 py-6 text-sm leading-7 text-[var(--muted)]">
                Nothing pending on the other side right now.
              </div>
            ) : (
              data.outgoing.map((request) => (
                <div key={request.id} className="rounded-[var(--radius-md)] border border-[var(--line)] bg-white/90 p-4">
                  <div className="flex items-center gap-3">
                    <InitialsAvatar displayName={request.profile.display_name} handle={request.profile.handle} />
                    <div>
                      <p className="h3 text-[1.15rem]">{request.profile.display_name ?? request.profile.handle}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">Awaiting acceptance</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
