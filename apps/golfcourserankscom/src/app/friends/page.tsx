import Link from "next/link";

import { FriendsManager } from "@/components/FriendsManager";
import { getFriendsPageData } from "@/lib/data";
import { getViewerContext } from "@/lib/viewer";

const comparisonPreview = [
  { course: "Pinehurst No 2", you: "#1", friend: "#3" },
  { course: "Pebble Beach Golf Links", you: "#2", friend: "#1" },
  { course: "Pacific Dunes", you: "#3", friend: "#2" }
];

export default async function FriendsPage() {
  const viewer = await getViewerContext();

  if (!viewer.user || !viewer.profile?.onboarding_completed) {
    return (
      <div className="space-y-6">
        <section className="shell-panel rounded-[2.3rem] p-6 sm:p-8">
          <p className="section-label">Friends</p>
          <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
            Follow golf friends and compare the courses you both know.
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">
            Keep the social layer simple: connect by email, unlock overlap-only comparisons, and settle the group-chat debate with one clean side-by-side view.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/sign-in?next=/friends" className="solid-button min-h-11">
              Sign in to follow friends
            </Link>
            <Link href="/leaderboard" className="ghost-button min-h-11">
              Explore the leaderboard first
            </Link>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <section className="shell-panel rounded-[2rem] p-6">
            <p className="section-label">How compare works</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
              Same courses, two ranking styles, one fast answer.
            </h2>
            <div className="mt-5 grid gap-3">
              {comparisonPreview.map((row) => (
                <div
                  key={row.course}
                  className="grid gap-3 rounded-[1.6rem] border border-[var(--line)] bg-white/88 px-4 py-4 sm:grid-cols-[1.5fr_repeat(2,minmax(0,1fr))]"
                >
                  <div>
                    <p className="text-base font-semibold text-[var(--ink)]">{row.course}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">Only shared played courses show up in compare.</p>
                  </div>
                  <div className="rounded-[1.1rem] bg-[var(--pine-soft)] px-3 py-3 text-sm font-semibold text-[var(--pine)]">
                    Your rank {row.you}
                  </div>
                  <div className="rounded-[1.1rem] border border-[var(--line)] px-3 py-3 text-sm font-semibold text-[var(--ink)]">
                    Friend rank {row.friend}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="shell-panel rounded-[2rem] p-6">
            <p className="section-label">Why golfers use it</p>
            <div className="mt-4 grid gap-3">
              {[
                "Spot where your friend values a course higher or lower than you do.",
                "Keep friend comparisons limited to accepted connections and overlapping played lists.",
                "Share a ranking list before a trip so the group can see where tastes line up."
              ].map((item) => (
                <div key={item} className="rounded-[1.5rem] border border-[var(--line)] bg-white/88 px-4 py-4 text-sm leading-6 text-[var(--muted)]">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-[1.5rem] border border-dashed border-[var(--line)] px-4 py-4 text-sm leading-6 text-[var(--muted)]">
              Once you sign in, you can send a friend request by email, accept on the other side, and open the compare view from either profile.
            </div>
          </section>
        </section>
      </div>
    );
  }

  const friends = await getFriendsPageData(viewer.user.id);

  return (
    <div className="space-y-6">
      <section className="shell-panel rounded-[2.3rem] p-6 sm:p-8">
        <p className="section-label">Friends</p>
        <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
          Follow golf friends and compare your lists.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">
          Keep the social side simple: connect by email, accept on the other side, and unlock clean side-by-side comparisons built from the courses you both know.
        </p>
      </section>

      <FriendsManager initialData={friends} />
    </div>
  );
}
