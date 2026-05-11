import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InitialsAvatar } from "@/components/InitialsAvatar";
import { ShareButton } from "@/components/ShareButton";
import { getPublicProfileOverview, logAnalyticsEvent } from "@/lib/data";
import { formatLocation } from "@/lib/ranking";
import { getSiteUrl } from "@/lib/supabase/env";
import { getViewerContext } from "@/lib/viewer";

export async function generateMetadata({
  params,
  searchParams
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { handle } = await params;
  const query = await searchParams;
  const overview = await getPublicProfileOverview(handle, null);

  if (!overview) {
    return {
      title: "Profile not found | Golf Course Ranks"
    };
  }

  const requestedViewParam = query.view;
  const requestedView = Array.isArray(requestedViewParam) ? requestedViewParam[0] : requestedViewParam;
  const showWishlistFirst = requestedView === "wishlist";
  const displayName = overview.profile.display_name ?? overview.profile.handle;
  const title = showWishlistFirst
    ? `${displayName}'s golf wish list | Golf Course Ranks`
    : `${displayName}'s public-course rankings | Golf Course Ranks`;
  const description = showWishlistFirst
    ? `See which public courses ${displayName} wants to play next, then add them as a friend to compare your own list.`
    : `See how ${displayName} ranks public courses, compare that list to the crowd board, and add them as a friend to compare your own stack.`;
  const url = `${getSiteUrl()}/u/${overview.profile.handle}`;
  const imageUrl = showWishlistFirst ? `${url}/opengraph-image?view=wishlist` : `${url}/opengraph-image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: [imageUrl]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl]
    }
  };
}

export default async function PublicProfilePage({
  params,
  searchParams
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { handle } = await params;
  const query = await searchParams;
  const viewer = await getViewerContext();
  const overview = await getPublicProfileOverview(handle, viewer.user?.id ?? null);

  if (!overview) {
    notFound();
  }

  const profileUrl = `${getSiteUrl()}/u/${overview.profile.handle}`;
  const wishlistUrl = `${profileUrl}?view=wishlist#wishlist`;
  const requestedViewParam = query.view;
  const requestedView = Array.isArray(requestedViewParam) ? requestedViewParam[0] : requestedViewParam;
  const showWishlistFirst = requestedView === "wishlist";

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

  const profileMeta = [
    `@${overview.profile.handle}`,
    overview.profile.handicap_visibility && overview.profile.handicap_band
      ? `Handicap ${overview.profile.handicap_band}`
      : null,
    overview.profile.home_state || null
  ].filter(Boolean);
  const isOwnProfile = viewer.user?.id === overview.profile.id;
  const friendActionHref = viewer.user
    ? `/invite/${overview.profile.handle}?accept=1`
    : `/sign-in?next=${encodeURIComponent(`/invite/${overview.profile.handle}?accept=1`)}`;
  const primaryAction = isOwnProfile
    ? (
      <Link href="/friends" className="solid-button">
        Invite friends
      </Link>
    )
    : overview.canCompare
      ? (
        <Link href={friendActionHref} className="solid-button">
          Add as friend
        </Link>
      )
      : viewer.user
        ? (
          <Link href={`/compare/${overview.profile.handle}`} className="solid-button">
            Compare lists
          </Link>
        )
        : (
          <Link href={friendActionHref} className="solid-button">
            Add as friend
          </Link>
        );
  const topTenSection = (
    <section id="rankings" className="shell-panel p-6">
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
  );
  const wishlistSection = (
    <section id="wishlist" className="shell-panel p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">WISH LIST</p>
          <h2 className="h3 mt-4">The public courses this golfer wants to play next</h2>
        </div>
      </div>

      {overview.wishlistCourses.length === 0 ? (
        <div className="mt-5 rounded-[var(--radius-lg)] border border-dashed border-[var(--line)] px-5 py-8 text-sm leading-7 text-[var(--muted)]">
          No public wish-list courses are shared yet.
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {overview.wishlistCourses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="rounded-[var(--radius-md)] border border-[var(--line)] bg-white/90 p-4 transition hover:-translate-y-px hover:bg-white"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-4">
                  {course.leaderboard_rank ? (
                    <span className="pill pill-pine shrink-0">#{course.leaderboard_rank}</span>
                  ) : null}
                  <div>
                    <h3 className="h3 text-[1.2rem]">{course.name}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">{formatLocation(course)}</p>
                  </div>
                </div>
                <span className="pill pill-line pill-sentence">Wish list</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="space-y-6">
      <section className="shell-panel p-6 sm:p-8">
        <p className="eyebrow">PUBLIC PROFILE</p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <InitialsAvatar
            displayName={overview.profile.display_name}
            handle={overview.profile.handle}
            size="md"
          />
          <h1 className="h2">{overview.profile.display_name ?? overview.profile.handle}</h1>
        </div>
        <p className="subhed mt-4">{profileMeta.join(" | ")}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          {primaryAction}
          <ShareButton
            title={`${overview.profile.display_name ?? overview.profile.handle} on Golf Course Ranks`}
            text="Check out this public-course ranking profile on Golf Course Ranks."
            url={profileUrl}
            className="ghost-button"
            analyticsSurface="public-profile"
            buttonChildren="Share profile"
          />
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
            <Link href="/rankings" className="solid-button">
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

          {showWishlistFirst ? wishlistSection : topTenSection}
          {showWishlistFirst ? topTenSection : wishlistSection}
        </>
      )}
    </div>
  );
}
