import { ImageResponse } from "next/og";

import { getPublicProfileOverview } from "@/lib/data";

export const runtime = "nodejs";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default async function Image({
  params,
  searchParams
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { handle } = await params;
  const query = await searchParams;
  const overview = await getPublicProfileOverview(handle, null);

  const title = overview?.profile.display_name ?? overview?.profile.handle ?? "Golf Course Ranks";
  const courses = overview?.topCourses.slice(0, 10) ?? [];
  const wishlistCourses = overview?.wishlistCourses.slice(0, 10) ?? [];
  const requestedViewParam = query.view;
  const requestedView = Array.isArray(requestedViewParam) ? requestedViewParam[0] : requestedViewParam;
  const showWishlist = requestedView === "wishlist";
  const listTitle = showWishlist ? "Wish list" : "Top 10 public courses";
  const featuredCourses = showWishlist ? wishlistCourses : courses;
  const subtitle = showWishlist
    ? `${overview?.stats.playedCount ?? 0} played · ${wishlistCourses.length} on the wish list`
    : `${overview?.stats.topHundredPlayedCount ?? 0} of America's Top 100 played`;

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
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <svg viewBox="0 0 96 96" width="28" height="28" fill="none">
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
              <div style={{ fontSize: 22, letterSpacing: 3, textTransform: "uppercase", color: "#316b53" }}>
                Golf Course Ranks
              </div>
            </div>
            <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.02, maxWidth: 720 }}>{title}</div>
            <div style={{ fontSize: 28, color: "#5d6a64" }}>{subtitle}</div>
            <div style={{ fontSize: 24, color: "#316b53", fontStyle: "italic", maxWidth: 760 }}>
              {showWishlist
                ? "See the public courses this golfer wants to play next, then add them as a friend to compare lists."
                : "See how this golfer's Top 10 compares to the crowd board and add them as a friend to compare lists."}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 210 }}>
            <div style={{ fontSize: 20, color: "#5d6a64" }}>{listTitle}</div>
            {featuredCourses.slice(0, 5).map((course, index) => (
              <div key={course.id} style={{ fontSize: 22 }}>
                {showWishlist ? `${index + 1}.` : `#${("rankPosition" in course ? course.rankPosition + 1 : index + 1)}`} {course.name}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
          {featuredCourses.slice(0, 5).map((course, index) => (
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
                {showWishlist ? `Wish ${index + 1}` : `#${"rankPosition" in course ? course.rankPosition + 1 : index + 1}`}
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
