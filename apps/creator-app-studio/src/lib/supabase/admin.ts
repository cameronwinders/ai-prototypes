import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getServerSupabaseEnv } from "@/lib/supabase/env";

export function createAdminClient() {
  const env = getServerSupabaseEnv();

  if (!env.url || !env.serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for account management.");
  }

  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: env.schema
    },
    global: {
      headers: {
        "x-application-name": "creator-app-studio"
      }
    }
  });
}
