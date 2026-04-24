import prototypeConfig from "../../../prototype.config.json";

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const schema = process.env.APP_DB_SCHEMA ?? "app_caretaking";

  if (!url || !anonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return { url, anonKey, schema };
}

export function getSiteUrl() {
  if (typeof window !== "undefined" && window.location.origin) {
    return normalizeSiteUrl(window.location.origin);
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
  }

  if (prototypeConfig.siteUrl) {
    return normalizeSiteUrl(prototypeConfig.siteUrl);
  }

  return "http://localhost:3000";
}

export function getAppDbSchema() {
  return process.env.APP_DB_SCHEMA ?? "app_caretaking";
}

function normalizeSiteUrl(siteUrl: string) {
  return siteUrl.replace(/\/+$/, "");
}
