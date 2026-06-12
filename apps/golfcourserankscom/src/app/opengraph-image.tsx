import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default function Image() {
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 760 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <svg viewBox="0 0 96 96" width="42" height="42" fill="none">
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
              <div style={{ fontSize: 28, fontWeight: 600 }}>Golf Course Ranks</div>
            </div>
            <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2 }}>
              The hub for crowd rankings, golf media rankings, and the golfers you follow.
            </div>
            <div style={{ fontSize: 28, color: "#316b53", fontWeight: 500 }}>
              Compare the crowd board with Golf Digest, GOLF.com, and Golfweek, then invite friends to stack their lists beside both.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              minWidth: 300,
              borderRadius: 18,
              border: "1px solid rgba(28,41,36,0.12)",
              background: "rgba(255,255,255,0.92)",
              padding: 20
            }}
          >
            {[
              ["#1", "Pinehurst No 2"],
              ["#2", "Pebble Beach Golf Links"],
              ["#3", "Pacific Dunes"]
            ].map(([rank, name]) => (
              <div key={rank} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#316b53" }}>{rank}</div>
                <div style={{ flex: 1, fontSize: 22 }}>{name}</div>
              </div>
            ))}
            <div style={{ marginTop: 12, fontSize: 18, color: "#5d6a64" }}>See where the crowd disagrees with Golf Digest.</div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
