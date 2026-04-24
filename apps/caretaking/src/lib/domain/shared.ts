import { createHash } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Json } from "@/types/database";

// The app keeps SQL as the source of truth for RPC/RLS behavior. The handwritten
// Database type is intentionally partial, so we keep the runtime client flexible
// until generated Supabase types are wired into the deployment workflow.
export type AppSupabaseClient = SupabaseClient<any, string, any, any, any>;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function safeParseJson(value: string | undefined) {
  if (!value) {
    return {};
  }

  const parsed = JSON.parse(value) as Json;

  if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error("Details JSON must be an object.");
  }

  return parsed;
}

export function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}
