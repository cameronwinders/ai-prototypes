import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicSupabaseEnv } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  const env = getPublicSupabaseEnv();
  const response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  if (!env.url || !env.publicKey) {
    return response;
  }

  const supabase = createServerClient(env.url, env.publicKey, {
    db: {
      schema: env.schema
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

  return response;
}
