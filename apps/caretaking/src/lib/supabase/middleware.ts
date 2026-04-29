import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { LAST_SPACE_COOKIE } from "@/lib/domain/space-preferences";
import { getSupabaseEnv } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const { url, anonKey, schema } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    db: {
      schema
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  await supabase.auth.getClaims();

  const lastSpaceMatch = request.nextUrl.pathname.match(/^\/spaces\/([^/]+)/);
  const lastSpaceId = lastSpaceMatch?.[1];

  if (lastSpaceId && request.cookies.get(LAST_SPACE_COOKIE)?.value !== lastSpaceId) {
    response.cookies.set(LAST_SPACE_COOKIE, lastSpaceId, {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 60 * 60 * 24 * 180
    });
  }

  return response;
}
