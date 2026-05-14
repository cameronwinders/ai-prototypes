import Link from "next/link";

import { AvatarStack } from "@/components/InitialsAvatar";
import { getLeaderboardCourses } from "@/lib/data";
import { EDITORIAL_LISTS } from "@/lib/types";
import { formatCrowdScore, formatLocation, formatRankPosition, getRankDeltaDisplay } from "@/lib/ranking";
import { getViewerContext } from "@/lib/viewer";

function GapBadge({ delta }: { delta: number | null }) {
  const display = getRankDeltaDisplay(delta);

  if (!display) {
    return <span className="pill pill-line pill-sentence">No editorial average</span>;
  }

  const isUp = display.direction === "up";
  const isFlat = display.direction === "flat";

  return (
    <span
      className={`pill pill-sentence ${
        isFlat ? "pill-line" : isUp ? "pill-pine" : "pill-warning"
      }`}
      title={display.label}
    >
      {isFlat ? "All Square" : `${display.value} ${isUp ? "Up" : "Down"}`}
    </span>
  );
}

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

      <div className="mt-6 grid gap-3 lg:hidden">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/courses/${course.id}`}
            className="block rounded-lg border border-line bg-white/92 p-4 transition-[background-color,transform] duration-150 hover:-translate-y-px hover:bg-white"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-start gap-3">
                  <span className="pill pill-pine">#{course.leaderboardRank}</span>
                  <div className="min-w-0">
                    <h3 className="text-[1.65rem] font-semibold leading-[1.02] tracking-[var(--tracking-tight)] text-ink [overflow-wrap:anywhere]">
                      {course.name}
                    </h3>
                    <p className="meta mt-2">{formatLocation(course)}</p>
                    {course.friendPlayers?.length ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="meta">Friends played</span>
                        <AvatarStack people={course.friendPlayers} size="sm" max={3} />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <span className="shrink-0 pt-1 text-lg text-muted" aria-hidden="true">
                &gt;
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_10.5rem]">
              <div className="min-w-0 space-y-3">
                <span className={`pill ${course.isEarly ? "pill-warning" : "pill-pine"} pill-sentence`}>
                  {course.isEarly ? "Starting score" : "Crowd score"} {formatCrowdScore(course.normalizedScore)}
                </span>
              </div>

              <div className="overflow-hidden rounded-md border border-line bg-[rgba(246,243,236,0.92)]">
                {[
                  { key: "crowd", label: "Crowd" },
                  { key: "editorial", label: "Editorial avg" },
                  { key: "golf-top-100", label: "GOLF.com" },
                  { key: "golf-digest-public", label: "Golf Digest" },
                  { key: "golfweek-you-can-play", label: "Golfweek" }
                ].map((entry, index) => {
                  const isCrowd = entry.key === "crowd";
                  const isEditorial = entry.key === "editorial";
                  const value =
                    entry.key === "crowd"
                      ? formatRankPosition(course.leaderboardRank)
                      : entry.key === "editorial"
                        ? formatRankPosition(course.editorialAverageRank)
                        : formatRankPosition(course.editorialRanks?.[entry.key as keyof typeof course.editorialRanks]);

                  return (
                    <div
                      key={entry.key}
                      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2.5 ${
                        isCrowd
                          ? "bg-[rgba(49,107,83,0.16)]"
                          : isEditorial
                            ? "bg-[rgba(201,211,203,0.34)]"
                            : "bg-transparent"
                      } ${index === 4 ? "" : "border-b border-[rgba(28,41,36,0.08)]"}`}
                    >
                      <div className="min-w-0">
                        <span
                          className={`block min-w-0 text-[11px] uppercase tracking-[0.14em] ${
                            isCrowd || isEditorial ? "font-bold text-ink" : "font-semibold text-muted"
                          }`}
                        >
                          {entry.label}
                        </span>
                        {isEditorial ? (
                          <div className="mt-1">
                            <GapBadge delta={course.editorialGap} />
                          </div>
                        ) : null}
                      </div>
                      <span
                        className={`text-sm tracking-[-0.02em] text-ink ${
                          isCrowd || isEditorial ? "font-bold" : "font-semibold"
                        }`}
                      >
                        {value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 hidden overflow-hidden rounded-xl border border-line bg-white/90 lg:block">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[16%]" />
            <col className="w-[27%]" />
            <col className="w-[11%]" />
            <col className="w-[12%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-line bg-[rgba(255,255,255,0.98)] text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              <th className="px-4 py-4">Crowd</th>
              <th className="px-4 py-4">Course</th>
              <th className="px-4 py-4">Editorial avg</th>
              <th className="px-4 py-4">Crowd vs editorial</th>
              {EDITORIAL_LISTS.map((editorial) => (
                <th key={editorial.key} className="px-4 py-4">
                  {editorial.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id} className="border-b border-line last:border-b-0">
                <td className="px-4 py-5 align-top">
                  <Link href={`/courses/${course.id}`} className="block min-w-0">
                    <div className="font-display text-[2.2rem] font-semibold tracking-[var(--tracking-tighter)] text-ink">
                      #{course.leaderboardRank}
                    </div>
                    <div className={`mt-2 inline-flex ${course.isEarly ? "pill pill-warning" : "pill pill-pine"} pill-sentence`}>
                      {course.isEarly ? "Starting score" : "Crowd score"} {formatCrowdScore(course.normalizedScore)}
                    </div>
                    {course.friendPlayers?.length ? (
                      <div className="mt-3 flex items-center gap-2">
                        <AvatarStack people={course.friendPlayers} size="sm" max={3} />
                        <span className="text-xs uppercase tracking-[0.12em] text-muted">Friends played</span>
                      </div>
                    ) : null}
                  </Link>
                </td>
                <td className="px-4 py-5 align-top">
                  <Link href={`/courses/${course.id}`} className="block">
                    <h3 className="text-[1.28rem] font-semibold tracking-[var(--tracking-tight)] text-ink">{course.name}</h3>
                    <p className="meta mt-1">{formatLocation(course)}</p>
                  </Link>
                </td>
                <td className="px-4 py-5 align-top">
                  <div className="text-base font-semibold text-ink">{formatRankPosition(course.editorialAverageRank)}</div>
                </td>
                <td className="px-4 py-5 align-top">
                  <GapBadge delta={course.editorialGap} />
                </td>
                {EDITORIAL_LISTS.map((editorial) => (
                  <td key={editorial.key} className="px-4 py-5 align-top">
                    <div className="text-base font-semibold text-ink">
                      {formatRankPosition(course.editorialRanks?.[editorial.key])}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
            The hub for public U.S. golf-course rankings.
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
