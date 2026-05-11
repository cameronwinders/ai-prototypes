import Link from "next/link";
import { type Metadata } from "next";

import { FriendsManager } from "@/components/FriendsManager";
import { getFriendsPageData } from "@/lib/data";
import { getSiteUrl } from "@/lib/supabase/env";
import { getViewerContext } from "@/lib/viewer";

const comparisonPreview = [
  { course: "Pinehurst No 2", you: "#1", friend: "#3", friendName: "Mike" },
  { course: "Pebble Beach Golf Links", you: "#2", friend: "#1", friendName: "Mike" },
  { course: "Pacific Dunes", you: "#3", friend: "#2", friendName: "Mike" }
];

export const metadata: Metadata = {
  title: "Friends | Golf Course Ranks",
  description: "Invite golf friends, auto-connect when they join, and compare only the public courses you both know."
};

export default async function FriendsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const viewer = await getViewerContext();

  if (!viewer.user || !viewer.profile?.onboarding_completed) {
    return (
      <div className="space-y-6">
        <section className="shell-panel p-6 sm:p-8">
          <p className="eyebrow">FRIENDS</p>
          <h1 className="h2 mt-4">Follow golf friends and compare the courses you both know</h1>
          <p className="subhed mt-4">
            Share an invite link, find golfers fast, and compare only the rounds you both know.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/sign-in?next=/friends" className="solid-button min-h-11">
              Sign in to follow friends
            </Link>
            <Link href="/rankings" className="ghost-button min-h-11">
              Explore the leaderboard first
            </Link>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <section className="shell-panel-contrast p-6">
            <p className="eyebrow">HOW COMPARE WORKS</p>
            <h2 className="h3 mt-4">Same courses, two ranking styles, one fast answer</h2>
            <div className="mt-5 grid gap-3">
              {comparisonPreview.map((row) => (
                <div
                  key={row.course}
                  className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--line)] bg-white/88 px-4 py-4 sm:grid-cols-[1.5fr_repeat(2,minmax(0,1fr))]"
                >
                  <div>
                    <p className="h3 text-[1.15rem]">{row.course}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">Only shared played courses show up in compare.</p>
                  </div>
                  <div className="rounded-[var(--radius-md)] bg-[var(--pine-soft)] px-3 py-3 text-sm font-semibold text-[var(--pine)]">
                    Your rank {row.you}
                  </div>
                  <div className="rounded-[var(--radius-md)] border border-[var(--line)] px-3 py-3 text-sm font-semibold text-[var(--ink)]">
                    {row.friendName}'s rank {row.friend}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="shell-panel-soft p-6">
            <p className="eyebrow">WHY GOLFERS USE IT</p>
            <div className="mt-4 grid gap-3">
              {[
                "Spot where your friend values a course higher or lower than you do.",
                "Keep friend comparisons limited to accepted connections and overlapping played lists.",
                "Share an invite link or public profile before the next golf trip gets booked."
              ].map((item) => (
                <div key={item} className="rounded-[var(--radius-md)] border border-[var(--line)] bg-white/88 px-4 py-4 text-sm leading-7 text-[var(--muted)]">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-[var(--radius-md)] border border-dashed border-[var(--line)] px-4 py-4 text-sm leading-7 text-[var(--muted)]">
              Once you sign in, you can share an invite link, search golfers directly, or still fall back to the older email request path.
            </div>
          </section>
        </section>
      </div>
    );
  }

  const friends = await getFriendsPageData(viewer.user.id);
  const siteUrl = getSiteUrl();
  const inviteUrl = `${siteUrl}/invite/${viewer.profile?.handle ?? "golfer"}`;
  const joinedHandleParam = query.joined;
  const joinedNameParam = query.joined_name;
  const joinedHandle = Array.isArray(joinedHandleParam) ? joinedHandleParam[0] : joinedHandleParam ?? null;
  const joinedName = Array.isArray(joinedNameParam) ? joinedNameParam[0] : joinedNameParam ?? null;

  return (
    <div className="space-y-6">
      <section className="shell-panel p-6 sm:p-8">
        <p className="eyebrow">FRIENDS</p>
        <h1 className="h2 mt-4">Follow golf friends and compare your lists</h1>
        <p className="subhed mt-4">
          Share an invite link, let golfers auto-connect when they join through it, and unlock overlap-only comparisons.
        </p>
      </section>

      <FriendsManager
        initialData={friends}
        inviteUrl={inviteUrl}
        viewerHandle={viewer.profile?.handle ?? "golfer"}
        joinedHandle={joinedHandle}
        joinedName={joinedName}
      />
    </div>
  );
}
