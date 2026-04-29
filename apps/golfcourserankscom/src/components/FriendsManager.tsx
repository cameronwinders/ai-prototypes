"use client";

import { useState } from "react";
import Link from "next/link";

import { respondToFriendRequest, sendFriendRequest } from "@/app/actions";
import type { FriendsPageData } from "@/lib/types";

type FriendsManagerProps = {
  initialData: FriendsPageData;
};

export function FriendsManager({ initialData }: FriendsManagerProps) {
  const [data, setData] = useState(initialData);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSend() {
    setSubmitting(true);
    setStatus(null);
    const result = await sendFriendRequest(email);
    setSubmitting(false);
    setStatus(result.message ?? (result.ok ? "Friend request sent." : "Something went wrong."));
    if (result.ok) {
      setEmail("");
    }
  }

  async function handleAccept(friendshipId: string) {
    setPendingId(friendshipId);
    const result = await respondToFriendRequest(friendshipId, "accepted");
    setPendingId(null);
    setStatus(result.message ?? (result.ok ? "Request updated." : "Something went wrong."));
    if (result.ok) {
      setData((current) => ({
        accepted: current.accepted,
        incoming: current.incoming.filter((request) => request.id !== friendshipId),
        outgoing: current.outgoing
      }));
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="shell-panel rounded-[2rem] p-6">
        <p className="section-label">Add by email</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
          Build your golf circle and compare real lists.
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Requests stay private until the other golfer accepts. Once you are connected, you can compare shared courses without exposing your full history to everyone.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="friend@email.com"
            className="min-h-11 flex-1 rounded-[1.35rem] border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[rgba(49,107,83,0.45)]"
          />
          <button type="button" onClick={handleSend} disabled={submitting} className="solid-button min-h-11 justify-center">
            {submitting ? "Sending..." : "Send request"}
          </button>
        </div>

        {status ? <p className="mt-3 text-sm text-[var(--muted)]">{status}</p> : null}

        <div className="mt-8 grid gap-4">
          <div>
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">Accepted friends</h3>
            <div className="mt-3 grid gap-3">
              {data.accepted.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-[var(--line)] px-4 py-6 text-sm text-[var(--muted)]">
                  No accepted friendships yet. Add a golf friend by email to unlock side-by-side comparisons.
                </div>
              ) : (
                data.accepted.map((friend) => (
                  <div key={friend.friendshipId} className="rounded-[1.5rem] border border-[var(--line)] bg-white/90 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-[var(--ink)]">{friend.profile.display_name ?? friend.profile.handle}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {friend.overlapCount} shared courses | {friend.rankedCount} ranked courses
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/compare/${friend.profile.id}`} className="solid-button min-h-11">
                          Compare
                        </Link>
                        <Link href={`/feedback?screen=Friends&from=%2Ffriends&topic=feature`} className="ghost-button min-h-11">
                          Suggest a social feature
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <section className="shell-panel rounded-[2rem] p-6">
          <p className="section-label">Incoming</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
            Requests waiting on you
          </h3>
          <div className="mt-4 grid gap-3">
            {data.incoming.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[var(--line)] px-4 py-6 text-sm text-[var(--muted)]">
                No pending requests right now.
              </div>
            ) : (
              data.incoming.map((request) => (
                <div key={request.id} className="rounded-[1.5rem] border border-[var(--line)] bg-white/90 p-4">
                  <p className="text-lg font-semibold text-[var(--ink)]">{request.profile.display_name ?? request.profile.handle}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{request.profile.email ?? "Unknown email"}</p>
                  <button
                    type="button"
                    onClick={() => handleAccept(request.id)}
                    disabled={pendingId === request.id}
                    className="solid-button mt-4 min-h-11"
                  >
                    {pendingId === request.id ? "Accepting..." : "Accept request"}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="shell-panel rounded-[2rem] p-6">
          <p className="section-label">Outgoing</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
            Pending requests you sent
          </h3>
          <div className="mt-4 grid gap-3">
            {data.outgoing.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[var(--line)] px-4 py-6 text-sm text-[var(--muted)]">
                Nothing pending on the other side right now.
              </div>
            ) : (
              data.outgoing.map((request) => (
                <div key={request.id} className="rounded-[1.5rem] border border-[var(--line)] bg-white/90 p-4">
                  <p className="text-lg font-semibold text-[var(--ink)]">{request.profile.display_name ?? request.profile.handle}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">Awaiting acceptance</p>
                </div>
              ))
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
