import { formatRankPosition, getRankDeltaDisplay } from "@/lib/ranking";
import { type LeaderboardCourse } from "@/lib/types";

const MOBILE_RANK_STACK = [
  { key: "crowd", label: "Crowd" },
  { key: "editorial", label: "Editorial avg" },
  { key: "golf-top-100", label: "GOLF.com" },
  { key: "golf-digest-public", label: "Golf Digest" },
  { key: "golfweek-you-can-play", label: "Golfweek" }
] as const;

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

function formatEditorialPosition(position?: number | null) {
  return formatRankPosition(position);
}

export function RankingsMobileStack({ course }: { course: LeaderboardCourse }) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-[rgba(246,243,236,0.92)]">
      {MOBILE_RANK_STACK.map((entry, index) => {
        const value =
          entry.key === "crowd"
            ? formatRankPosition(course.leaderboardRank)
            : entry.key === "editorial"
              ? formatRankPosition(course.editorialAverageRank)
              : formatEditorialPosition(course.editorialRanks?.[entry.key]);

        const isCrowd = entry.key === "crowd";
        const isEditorial = entry.key === "editorial";

        return (
          <div
            key={entry.key}
            className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2.5 ${
              isCrowd
                ? "bg-[rgba(49,107,83,0.16)]"
                : isEditorial
                  ? "bg-[rgba(201,211,203,0.34)]"
                  : "bg-transparent"
            } ${index === MOBILE_RANK_STACK.length - 1 ? "" : "border-b border-[rgba(28,41,36,0.08)]"}`}
          >
            <div className="min-w-0">
              <span
                className={`block min-w-0 text-[11px] uppercase tracking-[0.14em] ${
                  isCrowd || isEditorial ? "font-bold text-ink" : "font-semibold text-muted"
                }`}
              >
                {entry.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isCrowd ? <GapBadge delta={course.editorialGap} /> : null}
              <span
                className={`text-sm tracking-[-0.02em] text-ink ${
                  isCrowd || isEditorial ? "font-bold" : "font-semibold"
                }`}
              >
                {value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
