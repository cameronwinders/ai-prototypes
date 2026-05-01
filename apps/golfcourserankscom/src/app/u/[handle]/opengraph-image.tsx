import { ImageResponse } from "next/og";

import { getPublicProfileOverview } from "@/lib/data";

export const runtime = "nodejs";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default async function Image({
  params
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const overview = await getPublicProfileOverview(handle, null);

  const title = overview?.profile.display_name ?? overview?.profile.handle ?? "Golf Course Ranks";
  const courses = overview?.topCourses.slice(0, 10) ?? [];

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #f6f3ec 0%, #ece4d8 100%)",
          color: "#18252b",
          padding: 48,
          flexDirection: "column",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 22, letterSpacing: 3, textTransform: "uppercase", color: "#316b53" }}>
              Golf Course Ranks
            </div>
            <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.02, maxWidth: 720 }}>{title}</div>
            <div style={{ fontSize: 28, color: "#5d6a64" }}>
              {overview?.stats.topHundredPlayedCount ?? 0} of America&apos;s Top 100 played
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 210 }}>
            <div style={{ fontSize: 20, color: "#5d6a64" }}>Top 10 public courses</div>
            {courses.slice(0, 5).map((course) => (
              <div key={course.id} style={{ fontSize: 22 }}>
                #{course.rankPosition + 1} {course.name}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
          {courses.map((course) => (
            <div
              key={course.id}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                borderRadius: 24,
                background: "rgba(255,255,255,0.9)",
                padding: 20,
                minHeight: 132
              }}
            >
              <div style={{ fontSize: 18, color: "#316b53", textTransform: "uppercase", letterSpacing: 1.5 }}>
                #{course.rankPosition + 1}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>{course.name}</div>
              <div style={{ fontSize: 18, color: "#5d6a64" }}>
                {course.city}, {course.state}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
