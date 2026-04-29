import Link from "next/link";

import { ShareButton } from "@/components/ShareButton";
import { getProfileSummary } from "@/lib/data";
import { requireViewer } from "@/lib/viewer";

export default async function ProfilePage() {
  const viewer = await requireViewer("/profile");
  const summary = await getProfileSummary(viewer.user!.id);

  return (
    <div className="space-y-6">
      <section className="shell-panel rounded-[2.3rem] p-6 sm:p-8">
        <p className="section-label">Me</p>
        <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
          {summary.profile?.display_name ?? summary.profile?.handle ?? "Your profile"}
        </h1>
        <p className="mt-3 text-lg text-[var(--muted)]">
          {summary.profile?.email ?? viewer.user?.email ?? "No email available"} | handicap {summary.profile?.handicap_band ?? "pending"}
        </p>
        <div className="mt-6">
          <ShareButton
            title="Share your Golf Course Ranks profile"
            text="See how I rank public golf courses on Golf Course Ranks."
            url="https://ai-prototypes-golfcourserankscom.vercel.app/profile"
            className="ghost-button min-h-11"
          />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          {[
            { label: "Played courses", value: summary.playedCount },
            { label: "Ranked courses", value: summary.rankedCount },
            { label: "Accepted friends", value: summary.acceptedFriends },
            { label: "Incoming requests", value: summary.incomingRequests }
          ].map((item) => (
            <div key={item.label} className="rounded-[1.7rem] border border-[var(--line)] bg-white/88 p-4">
              <p className="text-sm text-[var(--muted)]">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="shell-panel rounded-[2rem] p-6">
          <p className="section-label">Keep going</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
            Keep your rankings fresh.
          </h2>
          <div className="mt-5 flex flex-col gap-3">
            <Link href="/courses" className="solid-button min-h-11 justify-center">
              Browse courses
            </Link>
            <Link href="/me/courses" className="ghost-button min-h-11 justify-center">
              Open My Courses
            </Link>
          </div>
        </div>

        <div className="shell-panel rounded-[2rem] p-6">
          <p className="section-label">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
            A cleaner way to compare public golf.
          </h2>
          <div className="mt-5 grid gap-3">
            {[
              "Leaderboard movement comes from real ordering, not star ratings.",
              "Early courses are clearly labeled while the network continues to grow.",
              "Your played and ranked history only becomes comparable after an accepted friendship."
            ].map((item) => (
              <div key={item} className="rounded-[1.5rem] border border-[var(--line)] bg-white/88 px-4 py-4 text-sm leading-6 text-[var(--muted)]">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
