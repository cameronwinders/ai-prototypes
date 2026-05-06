import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ShareButton } from "@/components/ShareButton";
import { getPublicProfileOverview, logAnalyticsEvent } from "@/lib/data";
import { formatLocation } from "@/lib/ranking";
import { getSiteUrl } from "@/lib/supabase/env";
import { getViewerContext } from "@/lib/viewer";

export async function generateMetadata({
  params
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const overview = await getPublicProfileOverview(handle, null);

  if (!overview) {
    return {
      title: "Profile not found | Golf Course Ranks"
    };
  }

  const title = `${overview.profile.display_name ?? overview.profile.handle} | Golf Course Ranks`;
  const description = `${overview.stats.playedCount} played · ${overview.stats.rankedCount} ranked · ${overview.stats.topHundredPlayedCount} of the Top 100 played.`;
  const url = `${getSiteUrl()}/u/${overview.profile.handle}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: [`${url}/opengraph-image`]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${url}/opengraph-image`]
    }
  };
}

export default async function PublicProfilePage({
  params
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const viewer = await getViewerContext();
  const overview = await getPublicProfileOverview(handle, viewer.user?.id ?? null);

  if (!overview) {
    notFound();
  }

  const profileUrl = `${getSiteUrl()}/u/${overview.profile.handle}`;

  if (overview.visibilityState === "visible") {
    await logAnalyticsEvent({
      userId: viewer.user?.id ?? null,
      eventName: "profile_viewed",
      payload: {
        profile_handle: overview.profile.handle,
        own_profile: viewer.user?.id === overview.profile.id
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="shell-panel p-6 sm:p-8">
        <p className="eyebrow">PUBLIC PROFILE</p>
        <h1 className="h2 mt-4">{overview.profile.display_name ?? overview.profile.handle}</h1>
        <p className="subhed mt-4">
          @{overview.profile.handle}
          {overview.profile.handicap_visibility && overview.profile.handicap_band ? ` · Handicap ${overview.profile.handicap_band}` : ""}
          {overview.profile.home_state ? ` · ${overview.profile.home_state}` : ""}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ShareButton
            title={`${overview.profile.display_name ?? overview.profile.handle} on Golf Course Ranks`}
            text="Check out this public-course ranking profile on Golf Course Ranks."
            url={profileUrl}
            className="solid-button"
            analyticsSurface="public-profile"
            buttonChildren="Copy profile link"
          />
          {overview.canCompare ? (
            <Link href={`/invite/${overview.profile.handle}`} className="ghost-button">
              Compare lists with {overview.profile.display_name ?? overview.profile.handle}
            </Link>
          ) : null}
        </div>
      </section>

      {overview.visibilityState !== "visible" ? (
        <section className="shell-panel-contrast p-6">
          <p className="eyebrow">PROFILE UNAVAILABLE</p>
          <h2 className="h3 mt-4">
            {overview.visibilityState === "private"
              ? "This golfer keeps their profile private."
              : "This profile is only visible to accepted friends."}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            You can still explore the leaderboard, save courses you have played, and share your own profile once your list is ready.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/leaderboard" className="solid-button">
              Explore leaderboard
            </Link>
            {viewer.user ? (
              <Link href={`/invite/${overview.profile.handle}`} className="ghost-button">
                Open friend invite
              </Link>
            ) : null}
          </div>
        </section>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Courses played", value: overview.stats.playedCount },
              { label: "Courses ranked", value: overview.stats.rankedCount },
              { label: "Top-100 played", value: overview.stats.topHundredPlayedCount },
              { label: "Friends", value: overview.stats.friendsCount }
            ].map((item) => (
              <div key={item.label} className="shell-panel-contrast p-5">
                <p className="meta">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-[var(--tracking-tight)] text-[var(--ink)]">
                  {item.value}
                </p>
              </div>
            ))}
          </section>

          <section className="shell-panel p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">TOP 10</p>
                <h2 className="h3 mt-4">The courses this golfer keeps highest</h2>
              </div>
            </div>

            {overview.topCourses.length === 0 ? (
              <div className="mt-5 rounded-[var(--radius-lg)] border border-dashed border-[var(--line)] px-5 py-8 text-sm leading-7 text-[var(--muted)]">
                No ranked courses are public yet. Check back after this golfer finishes their first stack.
              </div>
            ) : (
              <div className="mt-5 grid gap-3">
                {overview.topCourses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="rounded-[var(--radius-md)] border border-[var(--line)] bg-white/90 p-4 transition hover:-translate-y-px hover:bg-white"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-start gap-4">
                        <span className="pill pill-pine shrink-0">#{course.rankPosition + 1}</span>
                        <div>
                          <h3 className="h3 text-[1.2rem]">{course.name}</h3>
                          <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                        </div>
                      </div>
                      <span className="pill pill-line pill-sentence">Personal rank #{course.rankPosition + 1}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
