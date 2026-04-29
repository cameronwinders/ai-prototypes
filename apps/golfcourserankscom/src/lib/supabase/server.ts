import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { NextRequest, NextResponse } from "next/server";

import { getPublicSupabaseEnv, getServerSupabaseEnv } from "@/lib/supabase/env";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const env = getPublicSupabaseEnv();

  if (!env.url || !env.publicKey) {
    throw new Error("Missing Supabase public environment variables.");
  }

  return createServerClient(env.url, env.publicKey, {
    db: {
      schema: env.schema
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Middleware refreshes the session when server components cannot write cookies.
        }
      }
    }
  });
}

export function createRouteSupabaseClient(request: NextRequest, response: NextResponse) {
  const env = getPublicSupabaseEnv();

  if (!env.url || !env.publicKey) {
    throw new Error("Missing Supabase public environment variables.");
  }

  return createServerClient(env.url, env.publicKey, {
    db: {
      schema: env.schema
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });
}

export function createPublicAuthClient() {
  const env = getServerSupabaseEnv();

  if (!env.url || !env.publicKey) {
    throw new Error("Missing Supabase public environment variables.");
  }

  return createClient(env.url, env.publicKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        "x-application-name": "golfcourserankscom"
      }
    }
  });
}
