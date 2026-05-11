import { ImageResponse } from "next/og";

import { getProfileByHandle } from "@/lib/data";

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
  const inviter = await getProfileByHandle(handle);
  const inviterName = inviter?.display_name ?? inviter?.handle ?? "A golfer";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #fbf8f2 0%, #ece4d8 100%)",
          color: "#18252b",
          padding: 48,
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

        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 980 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2 }}>
            {inviterName} invited you to compare your golf-course rankings.
          </div>
          <div style={{ fontSize: 28, color: "#316b53", fontStyle: "italic" }}>
            Open the invite, auto-connect, and see where your lists overlap and differ.
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16
          }}
        >
          {[
            "Auto-connect when you join through the invite link",
            "Compare only the public courses you both know",
            "See the crowd board beside your own list"
          ].map((item) => (
            <div
              key={item}
              style={{
                borderRadius: 18,
                background: "rgba(255,255,255,0.92)",
                padding: 20,
                fontSize: 24,
                lineHeight: 1.25
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
