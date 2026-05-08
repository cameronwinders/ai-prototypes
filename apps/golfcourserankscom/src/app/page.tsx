import Link from "next/link";

import { CourseRow } from "@/components/CourseRow";
import { getLeaderboardCourses } from "@/lib/data";
import { formatRankPosition } from "@/lib/ranking";
import { getViewerContext } from "@/lib/viewer";

function RankingsPreview({
  title,
  subhed,
  courses,
  href,
  cta
}: {
  title: string;
  subhed: string;
  courses: Awaited<ReturnType<typeof getLeaderboardCourses>>;
  href: string;
  cta: string;
}) {
  return (
    <section className="shell-panel shell-panel-soft p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <h2 className="h2 text-[1.85rem] text-ink">{title}</h2>
          <p className="subhed mt-3">{subhed}</p>
        </div>
        <Link
          href={href}
          className="text-sm font-semibold tracking-[var(--tracking-normal)] text-pine transition-colors duration-150 hover:text-ink"
        >
          Open full board
        </Link>
      </div>

        <div className="mt-6 grid gap-3">
        {courses.map((course) => (
          <CourseRow key={course.id} course={course} href={`/courses/${course.id}`} actionLabel="" />
        ))}
      </div>

      <div className="mt-6">
        <Link href={href} className="solid-button min-h-11">
          {cta}
        </Link>
      </div>
    </section>
  );
}

function GolfDigestPreview({
  courses
}: {
  courses: Awaited<ReturnType<typeof getLeaderboardCourses>>;
}) {
  return (
    <section className="shell-panel shell-panel-contrast p-6">
      <div className="max-w-3xl">
        <h2 className="h2 text-[1.85rem] text-ink">Golf Digest rankings</h2>
        <p className="subhed mt-3">
          The same public courses, sorted by Golf Digest, so you can compare the media board against the crowd board.
        </p>
      </div>

      <div className="mt-6 grid gap-3">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/courses/${course.id}`}
            className="block rounded-md border border-line bg-white/92 p-4 transition-[background-color,transform] duration-150 hover:-translate-y-px hover:bg-white"
          >
            <div className="grid gap-4 md:grid-cols-[92px_minmax(0,1.6fr)_minmax(0,1.1fr)_auto] md:items-center">
              <div className="font-display text-[2rem] font-semibold tracking-[var(--tracking-tighter)] text-ink">
                {formatRankPosition(course.editorialRanks?.["golf-digest-public"])}
              </div>

              <div className="min-w-0">
                <h3 className="text-[1.2rem] font-semibold tracking-[var(--tracking-tight)] text-ink">{course.name}</h3>
                <p className="meta mt-1">
                  {course.city}, {course.state}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="pill pill-line">Crowd {formatRankPosition(course.leaderboardRank)}</span>
                <span className="pill pill-line">Editorial avg {formatRankPosition(course.editorialAverageRank)}</span>
                {course.editorialRanks?.["golf-top-100"] ? (
                  <span className="pill pill-line">GOLF.com {formatRankPosition(course.editorialRanks["golf-top-100"])}</span>
                ) : null}
                {course.editorialRanks?.["golfweek-you-can-play"] ? (
                  <span className="pill pill-line">
                    Golfweek {formatRankPosition(course.editorialRanks["golfweek-you-can-play"])}
                  </span>
                ) : null}
              </div>

              <div className="text-left text-sm text-muted md:text-right">Golf Digest board</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <Link href="/leaderboard?sort=golf-digest-public" className="solid-button min-h-11">
          Open Golf Digest board
        </Link>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const viewer = await getViewerContext();
  const [crowdBoard, golfDigestBoard] = await Promise.all([
    getLeaderboardCourses({ limit: 3 }),
    getLeaderboardCourses({ limit: 3, sort: "golf-digest-public" })
  ]);

  return (
    <div className="space-y-6">
      <section className="shell-panel shell-panel-contrast p-6 sm:p-8 lg:p-10">
        <div className="max-w-5xl">
          <h1 className="h1-display text-[3.55rem] text-ink sm:text-[5.1rem]">
            The hub for crowd rankings, golf media rankings, and the golfers you follow.
          </h1>
          <p className="subhed mt-4 max-w-4xl">
            Compare real-golfer rankings across the U.S. with Golf Digest, GOLF.com, and Golfweek, then invite friends to stack their own lists beside both.
          </p>

          <div className="mt-8 flex flex-wrap items-start gap-3">
            <Link
              href={viewer.user ? (viewer.profile?.onboarding_completed ? "/me/courses" : "/onboarding") : "/sign-in?next=/me/courses"}
              className="solid-button min-h-11"
            >
              {viewer.user ? "Rank my courses" : "Start ranking"}
            </Link>
            <Link href="/leaderboard" className="ghost-button min-h-11">
              Explore overall rankings
            </Link>
            <Link
              href={viewer.user ? "/friends" : "/sign-in?next=/friends"}
              className="ghost-button min-h-11"
            >
              Follow friends
            </Link>
          </div>
        </div>
      </section>

      <RankingsPreview
        title="National crowd rankings"
        subhed="This is the crowd-sourced board: real golfers rank the public courses they actually played, and you can compare that directly against the golf media."
        courses={crowdBoard}
        href="/leaderboard"
        cta="Open full board"
      />

      <section className="shell-panel shell-panel-contrast p-6 sm:p-7">
        <div className="max-w-3xl">
          <h2 className="h2 text-[1.85rem] text-ink">Follow friends and compare lists</h2>
          <p className="subhed mt-3">
            Invite the golfers you know, follow their rankings, and compare where your favorites line up or split from theirs.
          </p>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          <div className="rounded-md border border-line bg-white/92 p-5">
            <p className="eyebrow">INVITE</p>
            <h3 className="h3 mt-4 text-[1.3rem]">Send your link</h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              Share one invite link so friends can join the board and connect to your list.
            </p>
          </div>
          <div className="rounded-md border border-line bg-white/92 p-5">
            <p className="eyebrow">FOLLOW</p>
            <h3 className="h3 mt-4 text-[1.3rem]">See who played what</h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              Follow friends to spot shared rounds, compare favorites, and see who has played each course.
            </p>
          </div>
          <div className="rounded-md border border-line bg-white/92 p-5">
            <p className="eyebrow">COMPARE</p>
            <h3 className="h3 mt-4 text-[1.3rem]">Put lists side by side</h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              Use the compare view to stack your list next to a friend, the crowd, and the golf media.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={viewer.user ? "/friends" : "/sign-in?next=/friends"} className="solid-button min-h-11">
            Open friends
          </Link>
          <Link href={viewer.user ? "/profile" : "/sign-in?next=/profile"} className="ghost-button min-h-11">
            Copy my invite link
          </Link>
        </div>
      </section>

      <GolfDigestPreview courses={golfDigestBoard} />
    </div>
  );
}
