import Link from "next/link";

import { EDITORIAL_LISTS, type LeaderboardCourse } from "@/lib/types";

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
            {course.isEarly ? "Starting score" : "Crowd score"} {course.normalizedScore.toFixed(1)}
          </span>
          {EDITORIAL_LISTS.map((editorial) => (
            <span key={editorial.key} className="pill pill-line">
              {editorial.label} {formatEditorialPosition(course.editorialRanks?.[editorial.key])}
            </span>
          ))}
        </div>

        <div className="min-w-[90px] text-right text-sm text-muted">
          {actionLabel ?? (course.numUniqueGolfers === 0 ? "No golfers yet" : `${course.numUniqueGolfers} golfers`)}
        </div>
      </div>
    </Link>
  );
}
