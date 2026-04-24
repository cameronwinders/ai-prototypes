export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const schema = process.env.APP_DB_SCHEMA ?? "app_creator_app_studio";

  if (!url || !anonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return { url, anonKey, schema };
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function getAppDbSchema() {
  return process.env.APP_DB_SCHEMA ?? "app_creator_app_studio";
}
