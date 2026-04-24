"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/lib/supabase/env";

export function createClient() {
  const { url, anonKey, schema } = getSupabaseEnv();

  return createBrowserClient(url, anonKey, {
    db: {
      schema
    }
  });
}
