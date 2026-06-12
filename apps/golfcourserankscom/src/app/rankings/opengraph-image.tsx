import { ImageResponse } from "next/og";

import { getLeaderboardCourses } from "@/lib/data";
import { formatRankPosition, getRankDeltaDisplay } from "@/lib/ranking";

export const runtime = "nodejs";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default async function Image() {
  const courses = await getLeaderboardCourses({
    handicapBand: null,
    minSignals: 0,
    state: null,
    sort: "crowd-vs-editorial",
    limit: 5,
    viewerId: null,
    activity: "all",
    signal: "all"
  });

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #fbf8f2 0%, #ece4d8 100%)",
          color: "#18252b",
          padding: 44,
          flexDirection: "column",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <svg viewBox="0 0 96 96" width="34" height="34" fill="none">
            <g stroke="#1c2924" strokeWidth="6" strokeLinecap="round">
              <line x1="14" y1="28" x2="56" y2="28" />
              <line x1="14" y1="52" x2="72" y2="52" />
              <line x1="14" y1="76" x2="86" y2="76" />
            </g>
            <g fill="#316b53">
              <path d="M14 28 L36 28 L23 4 Z" />
              <path d="M14 52 L36 52 L23 28 Z" />
              <path d="M14 76 L36 76 L23 52 Z" />
            </g>
          </svg>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 600 }}>Golf Course Ranks</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              display: "flex",
              fontSize: 66,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: -2,
              maxWidth: 960
            }}
          >
            See where the crowd disagrees with golf media.
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#316b53", fontWeight: 500 }}>
            Crowd rank versus Golf Digest, GOLF.com, and Golfweek on one board.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div
              style={{
                display: "flex",
                flex: 1.5,
                fontSize: 18,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "#5d6a64"
              }}
            >
              Course
            </div>
            <div
              style={{
                display: "flex",
                width: 120,
                fontSize: 18,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "#5d6a64"
              }}
            >
              Crowd
            </div>
            <div
              style={{
                display: "flex",
                width: 150,
                fontSize: 18,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "#5d6a64"
              }}
            >
              Editorial
            </div>
            <div
              style={{
                display: "flex",
                width: 150,
                fontSize: 18,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "#5d6a64"
              }}
            >
              Gap
            </div>
          </div>
          {courses.map((course) => {
            const gap = getRankDeltaDisplay(course.editorialGap);
            return (
              <div
                key={course.id}
                style={{
                  display: "flex",
                  gap: 12
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flex: 1.5,
                    padding: "14px 16px",
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.92)",
                    fontSize: 26,
                    fontWeight: 600
                  }}
                >
                  {course.name}
                </div>
                <div
                  style={{
                    display: "flex",
                    width: 120,
                    padding: "14px 16px",
                    borderRadius: 16,
                    background: "rgba(49,107,83,0.12)",
                    fontSize: 26,
                    fontWeight: 700
                  }}
                >
                  #{course.leaderboardRank}
                </div>
                <div
                  style={{
                    display: "flex",
                    width: 150,
                    padding: "14px 16px",
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.92)",
                    fontSize: 26,
                    fontWeight: 600
                  }}
                >
                  {formatRankPosition(course.editorialAverageRank)}
                </div>
                <div
                  style={{
                    display: "flex",
                    width: 150,
                    padding: "14px 16px",
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.92)",
                    fontSize: 26,
                    fontWeight: 700,
                    color:
                      gap?.direction === "up"
                        ? "#316b53"
                        : gap?.direction === "down"
                          ? "#9c6a2f"
                          : "#5d6a64"
                  }}
                >
                  {gap
                    ? gap.direction === "flat"
                      ? "All Square"
                      : `${gap.value} ${gap.direction === "up" ? "Up" : "Down"}`
                    : "—"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ),
    size
  );
}
