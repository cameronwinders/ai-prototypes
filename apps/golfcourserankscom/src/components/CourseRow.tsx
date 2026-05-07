import Link from "next/link";

import { AvatarStack } from "@/components/InitialsAvatar";
import { PlayedButton } from "@/components/PlayActions";
import { RankSignal } from "@/components/RankSignal";
import { EDITORIAL_LISTS, type LeaderboardCourse } from "@/lib/types";
import { formatCrowdScore } from "@/lib/ranking";

type CourseRowProps = {
  course: LeaderboardCourse;
  href: string;
  actionLabel?: string;
};

function formatEditorialPosition(position?: number) {
  return position ? `#${position}` : "\u2014";
}

export function CourseRow({ course, href, actionLabel }: CourseRowProps) {
  return (
    <Link
      href={href}
      className="block rounded-md border border-line bg-white/92 p-4 transition-[background-color,transform] duration-150 hover:-translate-y-px hover:bg-white"
    >
      <div className="grid gap-4 md:grid-cols-[74px_minmax(0,1.75fr)_minmax(0,1.2fr)_auto] md:items-center">
        <div className="font-display text-[2rem] font-semibold tracking-[var(--tracking-tighter)] text-ink">
          #{course.leaderboardRank}
        </div>

        <div className="min-w-0">
          <h3 className="text-[1.2rem] font-semibold tracking-[var(--tracking-tight)] text-ink">{course.name}</h3>
          <p className="meta mt-1">
            {course.city}, {course.state}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`pill ${course.isEarly ? "pill-warning" : "pill-pine"}`}>
            {course.isEarly ? "Starting score" : "Crowd score"} {formatCrowdScore(course.normalizedScore)}
          </span>
              {course.rankSignal ? <RankSignal signal={course.rankSignal} /> : null}
          {course.viewerPlayed ? <PlayedButton /> : null}
          {EDITORIAL_LISTS.map((editorial) => (
            <span key={editorial.key} className="pill pill-line">
              {editorial.label} {formatEditorialPosition(course.editorialRanks?.[editorial.key])}
            </span>
          ))}
        </div>

        <div className="min-w-[90px] text-left text-sm text-muted md:text-right">
          {actionLabel ?? (course.numUniqueGolfers === 0 ? "No golfers yet" : `${course.numUniqueGolfers} golfers`)}
          {course.friendPlayers?.length ? (
            <div className="mt-2 flex items-center gap-2 md:justify-end">
              <AvatarStack people={course.friendPlayers} size="sm" max={3} />
              <span className="text-xs uppercase tracking-[0.12em] text-muted">Friends played</span>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
