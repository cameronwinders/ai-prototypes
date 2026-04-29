import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "package.json",
  ".env.example",
  "supabase/config.toml",
  "supabase/migrations/0001_core_schema.sql",
  "supabase/migrations/0002_seed_roles.sql",
  "supabase/migrations/0003_hardening_rpc_and_delivery.sql",
  "supabase/migrations/0004_final_rls_and_safety.sql",
  "supabase/migrations/0010_app_schema_isolation.sql",
  "supabase/migrations/0011_app_schema_grants.sql",
  "supabase/migrations/0012_feedback_submissions.sql",
  "src/lib/supabase/server.ts",
  "src/lib/supabase/client.ts",
  "src/lib/supabase/middleware.ts"
];

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "APP_SLUG",
  "APP_DB_SCHEMA",
  "CRON_SECRET",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL"
];

const requiredSqlSnippets = [
  "create or replace function public.create_space_mvp",
  "create or replace function public.create_invite_mvp",
  "create or replace function public.accept_invite_mvp",
  "create or replace function public.create_event_mvp",
  "create or replace function public.create_reminder_mvp",
  "create or replace function public.process_due_reminders_mvp",
  "create schema if not exists app_caretaking",
  "create table if not exists app_caretaking.feedback_submissions",
  "create or replace function app_caretaking.create_space_mvp",
  "create policy \"events_select_member\"",
  "notifications_one_reminder_due_per_recipient_idx"
];

const requiredAppSnippets = [
  ["src/lib/supabase/env.ts", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
  ["src/lib/supabase/env.ts", "APP_DB_SCHEMA"],
  ["src/lib/supabase/server.ts", "createServerClient"],
  ["src/lib/supabase/server.ts", "schema"],
  ["src/lib/supabase/middleware.ts", "supabase.auth.getClaims()"],
  ["src/app/api/jobs/process-reminders/route.ts", "export async function GET"],
  ["src/app/api/jobs/process-reminders/route.ts", "process.env.CRON_SECRET"]
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

const combinedSql = [
  "supabase/migrations/0001_core_schema.sql",
  "supabase/migrations/0002_seed_roles.sql",
  "supabase/migrations/0003_hardening_rpc_and_delivery.sql",
  "supabase/migrations/0004_final_rls_and_safety.sql",
  "supabase/migrations/0010_app_schema_isolation.sql",
  "supabase/migrations/0011_app_schema_grants.sql",
  "supabase/migrations/0012_feedback_submissions.sql"
]
  .map((file) => readFileSync(join(root, file), "utf8"))
  .join("\n");

for (const snippet of requiredSqlSnippets) {
  if (!combinedSql.includes(snippet)) {
    console.error(`Missing SQL snippet: ${snippet}`);
    failed = true;
  }
}

for (const [file, snippet] of requiredAppSnippets) {
  const contents = readFileSync(join(root, file), "utf8");
  if (!contents.includes(snippet)) {
    console.error(`Missing app snippet in ${file}: ${snippet}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log("Config smoke check passed.");
