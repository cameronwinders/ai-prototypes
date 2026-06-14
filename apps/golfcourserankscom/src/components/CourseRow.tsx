import type { ReactNode } from "react";
import Link from "next/link";

import { AvatarStack } from "@/components/InitialsAvatar";
import { RankSignal } from "@/components/RankSignal";
import { formatCrowdScore, formatLocation, formatRankPosition, getRankDeltaDisplay } from "@/lib/ranking";
import { EDITORIAL_LISTS, type LeaderboardCourse } from "@/lib/types";

// Desktop rankings row — Web UI Kit spec (8 columns):
//   Crowd (rank + score) · Friends played · Course (+ inline signal) ·
//   Editorial avg · vs. editorial · Golf Digest · GOLF.com · Golfweek
// `action` replaces the trailing publication cell with a custom control
// (e.g. "Mark played" on Browse, "Saved" on Wishlist). When an action is
// present the whole row is NOT a link (so the action's buttons work without
// nesting interactive elements inside an anchor); instead the course name
// links through to the detail page.
const PUBLICATIONS = EDITORIAL_LISTS; // [golf-digest-public, golf-top-100, golfweek-you-can-play]

function rowGrid(wide: boolean) {
  // `wide` lets the trailing column flex to hold an action control (Browse / Wishlist).
  return wide
    ? "60px 110px minmax(0,1.7fr) 76px 90px 70px 70px minmax(132px,auto)"
    : "60px 110px minmax(0,1.7fr) 76px 90px 70px 70px 70px";
}

// Sort keys that match SORT_OPTIONS on /rankings (one per sortable column).
export type CourseRowSortKey =
  | "rank"
  | "editorial-average"
  | "crowd-vs-editorial"
  | "golf-digest-public"
  | "golf-top-100"
  | "golfweek-you-can-play";

type CourseRowSortProp = {
  current: CourseRowSortKey;
  hrefFor: (key: CourseRowSortKey) => string;
};

const HEAD_CELL_BASE = "text-[0.64rem] font-bold uppercase tracking-[0.08em]";

function HeadCell({
  label,
  align = "left",
  sortKey,
  sort
}: {
  label: string;
  align?: "left" | "center" | "right";
  sortKey?: CourseRowSortKey;
  sort?: CourseRowSortProp;
}) {
  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "";
  if (!sort || !sortKey) {
    return <div className={`${HEAD_CELL_BASE} ${alignClass} text-muted`}>{label}</div>;
  }
  const active = sort.current === sortKey;
  return (
    <div className={`${HEAD_CELL_BASE} ${alignClass}`}>
      <Link
        href={sort.hrefFor(sortKey)}
        className={`inline-flex items-center gap-1 transition-colors ${active ? "text-ink" : "text-muted hover:text-ink"}`}
        aria-label={`Sort by ${label}`}
        aria-current={active ? "true" : undefined}
      >
        <span>{label}</span>
        {active ? (
          <span aria-hidden="true" className="text-pine">
            {"▾"}
          </span>
        ) : null}
      </Link>
    </div>
  );
}

// Board-table column headers (surface v3) — caps Barlow over a 2px ink rule.
// Pass `sort` to make Crowd/Editorial avg/vs editorial/Golf Digest/GOLF.com/Golfweek
// clickable sort controls (used on /rankings); omit for static headers (home previews, browse).
export function CourseRowHeader({
  trailingLabel = "Golfweek",
  wide = false,
  sort
}: {
  trailingLabel?: string;
  wide?: boolean;
  sort?: CourseRowSortProp;
}) {
  const trailingSortKey: CourseRowSortKey | undefined = wide ? undefined : "golfweek-you-can-play";
  return (
    <div
      className="grid items-end gap-3.5 border-b-2 border-b-ink px-[18px] pb-[9px]"
      style={{ gridTemplateColumns: rowGrid(wide) }}
    >
      <HeadCell label="Crowd" sortKey="rank" sort={sort} />
      <HeadCell label="Friends played" align="center" />
      <HeadCell label="Course" />
      <HeadCell label="Editorial avg" align="center" sortKey="editorial-average" sort={sort} />
      <HeadCell label="vs. editorial" align="center" sortKey="crowd-vs-editorial" sort={sort} />
      <HeadCell label="Golf Digest" align="center" sortKey="golf-digest-public" sort={sort} />
      <HeadCell label="GOLF.com" align="center" sortKey="golf-top-100" sort={sort} />
      <HeadCell
        label={trailingLabel}
        align={wide ? "right" : "center"}
        sortKey={trailingSortKey}
        sort={sort}
      />
    </div>
  );
}

function FriendsPlayedCell({ course }: { course: LeaderboardCourse }) {
  const friends = course.friendPlayers ?? [];
  if (friends.length === 0) {
    return <div className="text-center text-[0.78rem] font-semibold text-muted">—</div>;
  }
  return (
    <div className="flex items-center justify-center gap-2">
      <AvatarStack people={friends} size="sm" max={3} />
      <span className="text-[0.78rem] font-bold tabular-nums text-ink">
        {friends.length > 3 ? `+${friends.length - 3}` : friends.length}
      </span>
    </div>
  );
}

export function CourseRow({ course, action }: { course: LeaderboardCourse; action?: ReactNode }) {
  const href = `/courses/${course.id}`;
  const hasAction = Boolean(action);
  const delta = getRankDeltaDisplay(course.editorialGap);
  const cvel = !delta ? "—" : delta.direction === "flat" ? "All Square" : `${delta.value} ${delta.direction === "up" ? "Up" : "Down"}`;
  const cvelColor =
    !delta || delta.direction === "flat"
      ? "text-muted"
      : delta.direction === "up"
        ? "text-pine"
        : "text-[var(--warning-ink)]";

  const cell = "text-center text-[0.85rem] font-semibold tabular-nums text-muted";

  const courseCell = (
    <>
      <div className="min-w-0">
        <h3 className="truncate text-[1rem] font-semibold leading-[1.2] tracking-[-0.01em] text-ink">{course.name}</h3>
        <p className="mt-0.5 text-[0.78rem] text-muted">{formatLocation(course)}</p>
      </div>
      {course.rankSignal ? <RankSignal signal={course.rankSignal} /> : null}
    </>
  );

  const body = (
    <div className="grid items-center gap-3.5" style={{ gridTemplateColumns: rowGrid(hasAction) }}>
      {/* Crowd — rank + score (board-table: 1.45rem/700 ink rank, muted score beneath) */}
      <div>
        <div className="text-[1.45rem] font-bold leading-none tracking-[-0.01em] tabular-nums text-ink">
          {course.leaderboardRank}
        </div>
        <div className={`mt-[3px] text-[0.78rem] font-semibold tabular-nums ${course.isEarly ? "text-[var(--warning-ink)]" : "text-muted"}`}>
          {formatCrowdScore(course.normalizedScore)}
          {course.isEarly ? "*" : ""}
        </div>
      </div>

      {/* Friends played */}
      <FriendsPlayedCell course={course} />

      {/* Course — name + city + inline signal (name links through when the row isn't a link) */}
      {hasAction ? (
        <Link href={href} className="flex min-w-0 items-center gap-2.5">
          {courseCell}
        </Link>
      ) : (
        <div className="flex min-w-0 items-center gap-2.5">{courseCell}</div>
      )}

      {/* Editorial avg */}
      <div className={cell}>{formatRankPosition(course.editorialAverageRank)}</div>

      {/* vs. editorial — caps delta */}
      <div className={`text-center text-[0.8rem] font-bold uppercase tabular-nums tracking-[0.02em] ${cvelColor}`}>{cvel}</div>

      {/* Golf Digest, GOLF.com */}
      <div className={cell}>{formatRankPosition(course.editorialRanks?.[PUBLICATIONS[0].key])}</div>
      <div className={cell}>{formatRankPosition(course.editorialRanks?.[PUBLICATIONS[1].key])}</div>

      {/* Golfweek — or action slot */}
      {hasAction ? <div className="flex justify-end">{action}</div> : <div className={cell}>{formatRankPosition(course.editorialRanks?.[PUBLICATIONS[2].key])}</div>}
    </div>
  );

  // Board table row (surface v3): no per-row card border/radius/background —
  // hairline separator only, hover tints linen-warm.
  const shell = "block border-b border-line px-[18px] py-[13px]";

  if (hasAction) {
    return <div className={`${shell} transition-colors duration-150 hover:bg-linen-warm`}>{body}</div>;
  }
  return (
    <Link href={href} className={`${shell} transition-colors duration-150 hover:bg-linen-warm`}>
      {body}
    </Link>
  );
}
