import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getServerSupabaseEnv } from "@/lib/supabase/env";

export function getLeadCaptureClient() {
  const env = getServerSupabaseEnv();

  if (!env.isConfigured || !env.url || !env.writeKey) {
    return {
      env,
      client: null
    };
  }

  const client = createClient(env.url, env.writeKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
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

  return {
    env,
    client
  };
}
