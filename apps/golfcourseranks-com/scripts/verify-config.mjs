import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const requiredFiles = [
  "package.json",
  ".env.example",
  "next-env.d.ts",
  "tsconfig.json",
  "src/app/layout.tsx",
  "src/app/leaderboard/page.tsx",
  "src/lib/supabase/env.ts",
  "src/app/actions.ts",
  "supabase/migrations/0001_app_schema.sql",
  "supabase/seeds/course-catalog.csv"
];

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "APP_SLUG",
  "APP_DB_SCHEMA",
  "CRON_SECRET"
];

let failed = false;

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) {
    console.error(`Missing required file: ${file}`);
    failed = true;
  }
}

const envExample = readFileSync(join(root, ".env.example"), "utf8");
for (const key of requiredEnv) {
  if (!envExample.includes(`${key}=`)) {
    console.error(`Missing .env.example key: ${key}`);
    failed = true;
  }
}

const envFile = readFileSync(join(root, "src/lib/supabase/env.ts"), "utf8");
if (!envFile.includes("app_golfcourseranks_com_") || !envFile.includes("APP_DB_SCHEMA")) {
  console.error("Supabase env helper is missing the expected schema setup.");
  failed = true;
}

const sql = readFileSync(join(root, "supabase/migrations/0001_app_schema.sql"), "utf8");
if (!sql.includes("create schema if not exists app_golfcourseranks_com_")) {
  console.error("Base schema migration is missing the app schema creation statement.");
  failed = true;
}

if (failed) {
  process.exit(1);
}

console.log("Config smoke check passed for golfcourseranks-com.");
