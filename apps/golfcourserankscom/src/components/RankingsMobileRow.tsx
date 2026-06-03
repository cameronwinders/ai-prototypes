import Link from "next/link";

import { RankSignal } from "@/components/RankSignal";
import { formatCrowdScore, formatLocation, getRankDeltaDisplay } from "@/lib/ranking";
import type { LeaderboardCourse } from "@/lib/types";

/**
 * Compact mobile rankings row (design-system `.m-course-row`):
 *   rank + crowd-vs-editorial delta · name + location + signal · crowd score.
 * The per-publication editorial breakdown is intentionally moved off the row
 * and lives on the course detail page (tap through), per the mobile spec.
 */
export function RankingsMobileRow({ course }: { course: LeaderboardCourse }) {
  const delta = getRankDeltaDisplay(course.editorialGap);
  const deltaLabel = !delta ? "—" : delta.direction === "flat" ? "Square" : `${delta.value} ${delta.direction === "up" ? "Up" : "Down"}`;
  const deltaColor =
    !delta || delta.direction === "flat"
      ? "var(--muted)"
      : delta.direction === "up"
        ? "var(--pine)"
        : "var(--warning-ink)";

  return (
    <Link href={`/courses/${course.id}`} className="m-course-row">
      <div className="text-center leading-none">
        <div className="rank">#{course.leaderboardRank}</div>
        <div
          className="mt-1 font-mono text-[0.6rem] font-bold tracking-[0.04em]"
          style={{ color: deltaColor }}
          title="Crowd rank vs. editorial average"
        >
          {deltaLabel}
        </div>
      </div>

      <div className="min-w-0">
        <h2 className="name">{course.name}</h2>
        <div className="meta flex-wrap">
          <span>{formatLocation(course)}</span>
          {course.rankSignal ? <RankSignal signal={course.rankSignal} /> : null}
          {course.viewerPlayed ? <span className="font-semibold text-pine">Played</span> : null}
        </div>
      </div>

      <div>
        <div className="crowd" style={course.isEarly ? { color: "var(--warning-ink)" } : undefined}>
          {formatCrowdScore(course.normalizedScore)}
        </div>
        <div className="crowd-label">{course.isEarly ? "Starting" : "Crowd"}</div>
      </div>
    </Link>
  );
}
