import Link from "next/link";

import { CourseRow, CourseRowHeader } from "@/components/CourseRow";
import { RankingsMobileRow } from "@/components/RankingsMobileRow";
import { getLeaderboardCourses } from "@/lib/data";
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
          <p className="subhed-sm mt-3">{subhed}</p>
        </div>
        <Link
          href={href}
          className="text-sm font-semibold tracking-[var(--tracking-normal)] text-pine transition-colors duration-150 hover:text-ink"
        >
          Open full board
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-2 lg:hidden">
        {courses.map((course) => (
          <RankingsMobileRow key={course.id} course={course} />
        ))}
      </div>

      <div className="mt-6 hidden lg:block">
        <CourseRowHeader />
        <div className="grid gap-1.5">
          {courses.map((course) => (
            <CourseRow key={course.id} course={course} />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <Link href={href} className="solid-button min-h-11">
          {cta}
        </Link>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const viewer = await getViewerContext();
  const [crowdBoard, golfDigestBoard] = await Promise.all([
    getLeaderboardCourses({ limit: 5 }),
    getLeaderboardCourses({ limit: 5, sort: "golf-digest-public" })
  ]);

  return (
    <div className="space-y-6">
      <section className="shell-panel shell-panel-contrast p-6 sm:p-8 lg:p-10">
        <div className="max-w-5xl">
          <h1 className="h1-display text-[3.55rem] text-ink sm:text-[5.1rem]">
            Your hub for public U.S. golf-course rankings.
          </h1>
          <p className="subhed mt-4 max-w-4xl">
            Track the public courses you have played, build a wish list, compare the crowd against Golf Digest, GOLF.com, and Golfweek, and invite friends to stack their own lists beside yours.
          </p>

          <div className="mt-8 flex flex-wrap items-start gap-3">
            <Link href="/rankings" className="solid-button min-h-11">
              Explore overall rankings
            </Link>
            <Link
              href={viewer.user ? (viewer.profile?.onboarding_completed ? "/me/courses" : "/onboarding") : "/sign-in?next=/me/courses"}
              className="ghost-button min-h-11"
            >
              {viewer.user ? "Rank my courses" : "Start ranking"}
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
        href="/rankings"
        cta="Open full board"
      />

      <section className="shell-panel shell-panel-contrast p-6 sm:p-7">
        <div className="max-w-3xl">
          <h2 className="h2 text-[1.85rem] text-ink">Follow friends and compare lists</h2>
          <p className="subhed-sm mt-3">
            Invite the golfers you know, follow their rankings, and compare where your favorites line up or split from theirs.
          </p>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          <div className="rounded-md border border-line bg-white/92 p-5">
            <p className="eyebrow">INVITE</p>
            <h3 className="h3 text-[1.3rem]">Send your link</h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              Share one invite link so friends can join the board and connect to your list.
            </p>
          </div>
          <div className="rounded-md border border-line bg-white/92 p-5">
            <p className="eyebrow">FOLLOW</p>
            <h3 className="h3 text-[1.3rem]">See who played what</h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              Follow friends to spot shared rounds, compare favorites, and see who has played each course.
            </p>
          </div>
          <div className="rounded-md border border-line bg-white/92 p-5">
            <p className="eyebrow">COMPARE</p>
            <h3 className="h3 text-[1.3rem]">Put lists side by side</h3>
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

      <RankingsPreview
        title="Golf Digest rankings"
        subhed="The same public courses, sorted by Golf Digest, so you can compare the media board directly against the crowd board."
        courses={golfDigestBoard}
        href="/rankings?sort=golf-digest-public"
        cta="Open Golf Digest board"
      />
    </div>
  );
}
