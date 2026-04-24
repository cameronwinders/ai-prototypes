const DEFAULT_SCHEMA = "app_creator_app_studio";
const FALLBACK_SITE_URL = "http://localhost:3000";

export function getAppDbSchema() {
  return process.env.APP_DB_SCHEMA ?? DEFAULT_SCHEMA;
}

export function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return FALLBACK_SITE_URL;
}

export function getPublicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    url,
    publicKey,
    schema: getAppDbSchema(),
    isConfigured: Boolean(url && publicKey)
  };
}

export function getServerSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const writeKey = serviceRoleKey ?? publicKey;
  const missing = [];

  if (!url) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!writeKey) {
    missing.push(
      serviceRoleKey
        ? "SUPABASE_SERVICE_ROLE_KEY"
        : "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return {
    url,
    writeKey,
    schema: getAppDbSchema(),
    siteUrl: getSiteUrl(),
    usesServiceRole: Boolean(serviceRoleKey),
    isConfigured: missing.length === 0,
    missing
  };
}
