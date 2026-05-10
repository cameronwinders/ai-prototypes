import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname !== "/leaderboard") {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/rankings";

  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: ["/leaderboard"]
};
