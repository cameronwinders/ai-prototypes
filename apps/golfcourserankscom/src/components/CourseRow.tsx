import type { ReactNode } from "react";
import Link from "next/link";

import { AvatarStack } from "@/components/InitialsAvatar";
import { RankSignal } from "@/components/RankSignal";
import { formatCrowdScore, formatLocation, formatRankPosition, getRankDeltaDisplay } from "@/lib/ranking";
import { EDITORIAL_LISTS, type LeaderboardCourse } from "@/lib/types";

// Desktop rankings row — Web UI Kit spec (8 columns):
//   Crowd (rank + score) · Friends played · Course (+ inline signal) ·
//   Editorial avg · vs. editorial · Golf Digest · GOLF.com · Golfweek
// `action` replaces the trailing publication cell with a custom button
// (e.g. "Mark played" on Browse Courses, "Saved" on Wishlist).
const ROW_GRID = "60px 110px minmax(0,1.7fr) 76px 90px 70px 70px 70px";

const PUBLICATIONS = EDITORIAL_LISTS; // [golf-digest-public, golf-top-100, golfweek-you-can-play]

export function CourseRowHeader({ trailingLabel = "Golfweek" }: { trailingLabel?: string }) {
  const head = "font-mono text-[0.62rem] font-bold uppercase tracking-[0.08em] text-muted";
  return (
    <div className="grid items-center gap-3.5 px-[18px] pb-2" style={{ gridTemplateColumns: ROW_GRID }}>
      <div className={head}>Crowd</div>
      <div className={`${head} text-center`}>Friends played</div>
      <div className={head}>Course</div>
      <div className={`${head} text-center`}>Editorial avg</div>
      <div className={`${head} text-center`}>vs. editorial</div>
      <div className={`${head} text-center`}>Golf Digest</div>
      <div className={`${head} text-center`}>GOLF.com</div>
      <div className={`${head} text-center`}>{trailingLabel}</div>
    </div>
  );
}

function FriendsPlayedCell({ course }: { course: LeaderboardCourse }) {
  const friends = course.friendPlayers ?? [];
  if (friends.length === 0) {
    return <div className="text-center font-mono text-[0.78rem] font-semibold text-muted">—</div>;
  }
  return (
    <div className="flex items-center justify-center gap-2">
      <AvatarStack people={friends} size="sm" max={3} />
      <span className="font-mono text-[0.78rem] font-bold tabular-nums text-ink">
        {friends.length > 3 ? `+${friends.length - 3}` : friends.length}
      </span>
    </div>
  );
}

export function CourseRow({ course, action }: { course: LeaderboardCourse; action?: ReactNode }) {
  const delta = getRankDeltaDisplay(course.editorialGap);
  const cvel = !delta ? "—" : delta.direction === "flat" ? "All Square" : `${delta.value} ${delta.direction === "up" ? "Up" : "Down"}`;
  const cvelColor =
    !delta || delta.direction === "flat"
      ? "text-muted"
      : delta.direction === "up"
        ? "text-pine"
        : "text-[var(--warning-ink)]";

  const cell = "text-center font-mono text-[0.85rem] tabular-nums text-muted";

  return (
    <Link
      href={`/courses/${course.id}`}
      className="block rounded-sm border border-line bg-white px-[18px] py-3.5 transition-colors duration-150 hover:bg-[#fafafa]"
    >
      <div className="grid items-center gap-3.5" style={{ gridTemplateColumns: ROW_GRID }}>
        {/* Crowd — rank + score */}
        <div>
          <div className="font-mono text-[1.05rem] font-bold leading-none text-pine">#{course.leaderboardRank}</div>
          <div
            className={`mt-1 font-mono text-[0.7rem] tabular-nums tracking-[0.04em] ${course.isEarly ? "text-[var(--warning-ink)]" : "text-muted"}`}
          >
            {formatCrowdScore(course.normalizedScore)}
            {course.isEarly ? "*" : ""}
          </div>
        </div>

        {/* Friends played */}
        <FriendsPlayedCell course={course} />

        {/* Course — name + city + inline signal */}
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="min-w-0">
            <h3 className="truncate text-[1rem] font-semibold leading-[1.2] tracking-[-0.01em] text-ink">{course.name}</h3>
            <p className="mt-0.5 text-[0.78rem] text-muted">{formatLocation(course)}</p>
          </div>
          {course.rankSignal ? <RankSignal signal={course.rankSignal} /> : null}
        </div>

        {/* Editorial avg */}
        <div className={cell}>{formatRankPosition(course.editorialAverageRank)}</div>

        {/* vs. editorial */}
        <div className={`text-center font-mono text-[0.78rem] font-semibold tabular-nums tracking-[0.02em] ${cvelColor}`}>{cvel}</div>

        {/* Golf Digest, GOLF.com */}
        <div className={cell}>{formatRankPosition(course.editorialRanks?.[PUBLICATIONS[0].key])}</div>
        <div className={cell}>{formatRankPosition(course.editorialRanks?.[PUBLICATIONS[1].key])}</div>

        {/* Golfweek — or action slot */}
        {action ? (
          <div className="flex justify-end">{action}</div>
        ) : (
          <div className={cell}>{formatRankPosition(course.editorialRanks?.[PUBLICATIONS[2].key])}</div>
        )}
      </div>
    </Link>
  );
}
