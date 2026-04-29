import Link from "next/link";

import { getFriendsOverview } from "@/lib/data";
import { formatLocation } from "@/lib/ranking";
import { requireOnboardedViewer } from "@/lib/viewer";

export default async function FriendsPage() {
  const viewer = await requireOnboardedViewer("/friends");
  const overview = await getFriendsOverview(viewer.user!.id);

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[2.2rem] p-6 sm:p-8">
        <p className="section-label">Social-light</p>
        <h1 className="brand-heading mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
          Follow golfers and steal their best public-course ideas.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">
          See who you follow, skim their top-ranked courses, and open side-by-side comparisons when you want to line up your taste against theirs.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-label">Following feed</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                Friends’ top courses
              </h2>
            </div>
            <div className="rounded-full border border-[rgba(24,37,43,0.08)] bg-white/85 px-4 py-2 text-sm font-medium text-[var(--muted)]">
              {overview.followedProfiles.length} followed
            </div>
          </div>

          {overview.followedProfiles.length === 0 ? (
            <div className="mt-6 rounded-[1.6rem] border border-dashed border-[rgba(24,37,43,0.12)] px-5 py-8 text-sm leading-6 text-[var(--muted)]">
              Follow a golfer profile to start a lightweight feed of the courses they keep near the top of their own stack.
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {overview.followedProfiles.map(({ profile, topCourses }) => (
                <div
                  key={profile.id}
                  className="rounded-[1.8rem] border border-[rgba(24,37,43,0.08)] bg-white/90 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Link href={`/profile/${profile.handle}`} className="text-xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
                        {profile.display_name ?? profile.handle}
                      </Link>
                      <p className="mt-1 text-sm text-[var(--muted)]">@{profile.handle}</p>
                    </div>
                    <Link
                      href={`/compare/${profile.handle}`}
                      className="rounded-full border border-[rgba(24,37,43,0.08)] bg-[var(--sand)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
                    >
                      Compare
                    </Link>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {topCourses.length === 0 ? (
                      <p className="text-sm text-[var(--muted)]">No ranked courses yet.</p>
                    ) : (
                      topCourses.map((course) => (
                        <div key={course.id} className="rounded-[1.4rem] bg-[rgba(245,238,228,0.86)] px-4 py-3">
                          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--pine)]">
                            #{course.rankIndex + 1}
                          </p>
                          <p className="mt-1 text-base font-semibold text-[var(--ink)]">{course.name}</p>
                          <p className="text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel rounded-[2rem] p-6">
          <p className="section-label">Discover golfers</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
            Fresh profiles to browse
          </h2>
          <div className="mt-6 grid gap-3">
            {overview.discoveryProfiles.length === 0 ? (
              <div className="rounded-[1.6rem] border border-dashed border-[rgba(24,37,43,0.12)] px-4 py-6 text-sm text-[var(--muted)]">
                More golfers will show up here as they finish onboarding.
              </div>
            ) : (
              overview.discoveryProfiles.map((profile) => (
                <Link
                  key={profile.id}
                  href={`/profile/${profile.handle}`}
                  className="rounded-[1.6rem] border border-[rgba(24,37,43,0.08)] bg-white/90 p-4 transition hover:bg-white"
                >
                  <p className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                    {profile.display_name ?? profile.handle}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    @{profile.handle} · handicap {profile.handicap_band ?? "pending"}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
