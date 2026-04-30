import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const CANONICAL_ORIGIN = "https://ai-prototypes-golfcourserankscom.vercel.app";

export function middleware(request: NextRequest) {
  const redirectUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, CANONICAL_ORIGIN);
  return NextResponse.redirect(redirectUrl, 308);
}

export const config = {
  matcher: ["/:path*"]
};
