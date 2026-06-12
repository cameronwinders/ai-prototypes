import { ImageResponse } from "next/og";

import { getCourseDetail } from "@/lib/data";
import { formatCrowdScore, formatLocation } from "@/lib/ranking";

export const runtime = "nodejs";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default async function Image({
  params
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const detail = await getCourseDetail(courseId, null, null);
  const course = detail?.course;

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
          <div style={{ fontSize: 26, fontWeight: 600 }}>Golf Course Ranks</div>
        </div>

        <div style={{ display: "flex", gap: 28, alignItems: "stretch" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
            <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2 }}>
              {course?.name ?? "Golf Course Ranks"}
            </div>
            <div style={{ fontSize: 30, color: "#5d6a64" }}>
              {course ? formatLocation(course) : "Crowd-ranked public golf"}
            </div>
            <div style={{ fontSize: 28, color: "#316b53", fontWeight: 500 }}>
              {detail?.aggregate
                ? `#${detail.aggregate.rank} crowd · ${formatCrowdScore(detail.aggregate.normalized_score)} crowd score`
                : "Editorial start with live golfer signal"}
            </div>
          </div>

          <div
            style={{
              width: 360,
              borderRadius: 18,
              border: "1px solid rgba(28,41,36,0.12)",
              background: "rgba(255,255,255,0.92)",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div style={{ fontSize: 18, letterSpacing: 2, textTransform: "uppercase", color: "#316b53" }}>
              Course snapshot
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 22 }}>
                {detail?.aggregate ? `${detail.aggregate.num_unique_golfers} golfers` : "No golfers yet"}
              </div>
              <div style={{ fontSize: 22 }}>
                {detail?.aggregate ? `${detail.aggregate.num_signals} comparisons` : "Editorial start"}
              </div>
              <div style={{ fontSize: 22 }}>
                {course?.editorialRanks
                  ? `Digest ${course.editorialRanks["golf-digest-public"] ? `#${course.editorialRanks["golf-digest-public"]}` : "—"}`
                  : "Digest —"}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
