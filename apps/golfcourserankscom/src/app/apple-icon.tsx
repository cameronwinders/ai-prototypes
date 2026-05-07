import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = {
  width: 256,
  height: 256
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #fffdf9 0%, #f6f3ec 100%)"
        }}
      >
        <svg viewBox="0 0 96 96" width="176" height="176" fill="none">
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
      </div>
    ),
    size
  );
}
