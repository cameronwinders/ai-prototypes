import { getRankDeltaDisplay } from "@/lib/ranking";

export function RankGapBadge({ delta }: { delta: number | null }) {
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
