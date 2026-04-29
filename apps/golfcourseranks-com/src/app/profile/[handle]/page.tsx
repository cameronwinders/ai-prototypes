import Link from "next/link";
import { notFound } from "next/navigation";

import { FollowButton } from "@/components/FollowButton";
import { getProfileOverview } from "@/lib/data";
import { formatLocation } from "@/lib/ranking";
import { getViewerContext } from "@/lib/viewer";

export default async function ProfilePage({
  params
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const viewer = await getViewerContext();
  const overview = await getProfileOverview(handle, viewer.user?.id ?? null);

  if (!overview) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[2.3rem] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="section-label">Golfer profile</p>
            <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
              {overview.profile.display_name ?? overview.profile.handle}
            </h1>
            <p className="mt-3 text-lg text-[var(--muted)]">
              @{overview.profile.handle} · handicap {overview.profile.handicap_band ?? "pending"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FollowButton
              handle={overview.profile.handle}
              initialFollowing={overview.isFollowing}
              disabled={overview.isSelf || !viewer.user}
            />
            {!overview.isSelf ? (
              <Link
                href={viewer.user ? `/compare/${overview.profile.handle}` : `/sign-in?next=/compare/${overview.profile.handle}`}
                className="rounded-full border border-[rgba(24,37,43,0.08)] bg-white/85 px-5 py-3 text-sm font-semibold text-[var(--ink)]"
              >
                Compare rankings
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Courses ranked", value: overview.rankings.length },
            { label: "Followers", value: overview.followerCount },
            { label: "Following", value: overview.followingCount }
          ].map((item) => (
            <div key={item.label} className="rounded-[1.7rem] border border-[rgba(24,37,43,0.08)] bg-white/88 p-4">
              <p className="text-sm text-[var(--muted)]">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-label">Top list</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
              Ordered public-course favorites
            </h2>
          </div>
          <Link
            href={`/feedback?screen=${encodeURIComponent("Profile")}&from=${encodeURIComponent(`/profile/${overview.profile.handle}`)}`}
            className="rounded-full border border-[rgba(24,37,43,0.08)] bg-white/85 px-4 py-2 text-sm font-semibold text-[var(--ink)]"
          >
            Feedback
          </Link>
        </div>

        {overview.rankings.length === 0 ? (
          <div className="mt-6 rounded-[1.6rem] border border-dashed border-[rgba(24,37,43,0.12)] px-5 py-8 text-sm leading-6 text-[var(--muted)]">
            This golfer has not ranked any courses yet.
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {overview.rankings.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="rounded-[1.7rem] border border-[rgba(24,37,43,0.08)] bg-white/90 p-4 transition hover:bg-white"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.2rem] bg-[var(--sand)] text-sm font-semibold text-[var(--ink)]">
                    #{course.rankIndex + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">{course.name}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
