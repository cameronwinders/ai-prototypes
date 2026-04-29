"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getPublicSupabaseEnv } from "@/lib/supabase/env";

export function createBrowserSupabaseClient() {
  const { url, publicKey, schema } = getPublicSupabaseEnv();

  if (!url || !publicKey) {
    throw new Error("Missing Supabase public environment variables.");
  }

  return createBrowserClient(url, publicKey, {
    db: {
      schema
    }
  });
}
