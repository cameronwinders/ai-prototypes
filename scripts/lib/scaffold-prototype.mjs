import path from "node:path";
import fs from "node:fs";

import {
  ensureDir,
  getTemplateDependencyVersions,
  schemaNameFromSlug,
  titleCaseFromSlug,
  writeFileIfChanged,
  writeJson
} from "./factory-helpers.mjs";

function buildReadme({ appSlug, displayName, schemaName, vercelProjectName }) {
  return `# ${displayName}

This prototype lives at \`apps/${appSlug}\` in the \`ai-prototypes\` monorepo.

## Factory Metadata

- app slug: \`${appSlug}\`
- schema: \`${schemaName}\`
- Vercel project: \`${vercelProjectName}\`

## Build Checklist

1. Paste the PM, Design, Testing, and Orchestrator briefs into \`spec/\`.
2. Run \`npm install\` at the monorepo root if the workspace lockfile changed.
3. Run \`npm run verify:config --workspace=${appSlug}\`.
4. Run \`npm run build --workspace=${appSlug}\`.
5. Deploy from Vercel using root directory \`apps/${appSlug}\`.
`;
}

function buildVerifyScript({ appSlug, schemaName }) {
  return `import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const requiredFiles = [
  "package.json",
  ".env.example",
  "next-env.d.ts",
  "tsconfig.json",
  "src/app/layout.tsx",
  "src/app/page.tsx",
  "src/lib/supabase/env.ts",
  "supabase/migrations/0001_app_schema.sql"
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
    console.error(\`Missing required file: \${file}\`);
    failed = true;
  }
}

const envExample = readFileSync(join(root, ".env.example"), "utf8");
for (const key of requiredEnv) {
  if (!envExample.includes(\`\${key}=\`)) {
    console.error(\`Missing .env.example key: \${key}\`);
    failed = true;
  }
}

const envFile = readFileSync(join(root, "src/lib/supabase/env.ts"), "utf8");
if (!envFile.includes("${schemaName}") || !envFile.includes("APP_DB_SCHEMA")) {
  console.error("Supabase env helper is missing the expected schema setup.");
  failed = true;
}

const sql = readFileSync(join(root, "supabase/migrations/0001_app_schema.sql"), "utf8");
if (!sql.includes("create schema if not exists ${schemaName}")) {
  console.error("Base schema migration is missing the app schema creation statement.");
  failed = true;
}

if (failed) {
  process.exit(1);
}

console.log("Config smoke check passed for ${appSlug}.");
`;
}

function buildSchemaMigration(schemaName) {
  return `create schema if not exists ${schemaName};

grant usage on schema ${schemaName} to anon, authenticated, service_role;
grant all privileges on all tables in schema ${schemaName} to service_role;
grant all privileges on all routines in schema ${schemaName} to service_role;
grant usage, select on all sequences in schema ${schemaName} to authenticated, service_role;

-- Add app-specific tables, functions, and policies in this schema.
-- The factory reconciles PostgREST's exposed schema list after registration.
`;
}

function buildLayout({ displayName, appSlug }) {
  return `import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "${displayName}",
  description: "Prototype child app ${appSlug} inside the ai-prototypes monorepo."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;
}

function buildPage({ displayName, appSlug, schemaName }) {
  return `export default function Home() {
  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">AI prototype child</p>
        <h1>${displayName}</h1>
        <p className="lede">
          This deployable scaffold was created at <code>apps/${appSlug}</code> and is wired for the shared Supabase schema <code>${schemaName}</code>.
        </p>
      </section>

      <section className="checklist-card">
        <h2>Next steps</h2>
        <ol>
          <li>Paste the Notion PM, Design, Testing, and Orchestrator handoffs into <code>spec/</code>.</li>
          <li>Implement the feature set for this prototype in <code>src/</code>.</li>
          <li>Run <code>npm run verify:config --workspace=${appSlug}</code> and <code>npm run build --workspace=${appSlug}</code>.</li>
        </ol>
      </section>
    </main>
  );
}
`;
}

function buildGlobalsCss() {
  return `:root {
  color-scheme: light;
  --bg: #f7f4ea;
  --surface: #fffdf7;
  --ink: #1f1a17;
  --muted: #655e59;
  --line: rgba(31, 26, 23, 0.1);
  --accent: #196c5d;
  --shadow: 0 18px 48px rgba(31, 26, 23, 0.08);
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: radial-gradient(circle at top, #fffaf0 0%, var(--bg) 45%, #efe7d5 100%);
  color: var(--ink);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

code {
  background: rgba(25, 108, 93, 0.08);
  border-radius: 0.4rem;
  padding: 0.12rem 0.35rem;
}

.app-shell {
  width: min(960px, calc(100vw - 2rem));
  margin: 0 auto;
  padding: 3rem 0 4rem;
  display: grid;
  gap: 1rem;
}

.hero-card,
.checklist-card {
  background: color-mix(in srgb, var(--surface) 92%, white 8%);
  border: 1px solid var(--line);
  border-radius: 1.5rem;
  padding: 1.5rem;
  box-shadow: var(--shadow);
}

.eyebrow {
  margin: 0 0 0.65rem;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.72rem;
  font-weight: 700;
}

.hero-card h1,
.checklist-card h2 {
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
  line-height: 0.95;
}

.hero-card h1 {
  font-size: clamp(2.8rem, 10vw, 4.8rem);
}

.checklist-card h2 {
  font-size: clamp(1.6rem, 4vw, 2.2rem);
}

.lede,
.checklist-card li {
  color: var(--muted);
  line-height: 1.6;
}

.checklist-card ol {
  margin: 1rem 0 0;
  padding-left: 1.25rem;
}
`;
}

function buildSupabaseEnv(schemaName) {
  return `export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const schema = process.env.APP_DB_SCHEMA ?? "${schemaName}";

  if (!url || !anonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return { url, anonKey, schema };
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function getAppDbSchema() {
  return process.env.APP_DB_SCHEMA ?? "${schemaName}";
}
`;
}

function buildSpecPlaceholder(title, appSlug, instruction) {
  return `# ${title}

Target app: \`apps/${appSlug}\`

${instruction}
`;
}

export function createPrototypeScaffold({
  rootDir,
  appSlug,
  displayName,
  description = "",
  vercelProjectName,
  siteUrl = "",
  sharedSupabaseProjectRef = "",
  force = false
}) {
  const safeDisplayName = displayName?.trim() || titleCaseFromSlug(appSlug);
  const schemaName = schemaNameFromSlug(appSlug);
  const targetDir = path.join(rootDir, "apps", appSlug);

  if (!force && pathExists(targetDir)) {
    throw new Error(`Prototype already exists at ${targetDir}`);
  }

  ensureDir(path.join(targetDir, "src", "app"));
  ensureDir(path.join(targetDir, "src", "lib", "supabase"));
  ensureDir(path.join(targetDir, "scripts"));
  ensureDir(path.join(targetDir, "supabase", "migrations"));
  ensureDir(path.join(targetDir, "spec"));

  const versions = getTemplateDependencyVersions(rootDir);

  writeJson(path.join(targetDir, "prototype.config.json"), {
    displayName: safeDisplayName,
    description,
    appSlug,
    schemaName,
    repoPath: `apps/${appSlug}`,
    vercelProjectName,
    siteUrl,
    sharedSupabaseProjectRef,
    managedBy: "ai-prototypes-factory"
  });

  writeFileIfChanged(
    path.join(targetDir, "package.json"),
    `${JSON.stringify(
      {
        name: appSlug,
        version: "0.1.0",
        private: true,
        packageManager: "npm@10.9.2",
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
          typecheck: "tsc --noEmit",
          "verify:config": "node scripts/verify-config.mjs"
        },
        dependencies: versions.dependencies,
        devDependencies: versions.devDependencies
      },
      null,
      2
    )}\n`
  );

  writeFileIfChanged(
    path.join(targetDir, ".env.example"),
    [
      "NEXT_PUBLIC_SUPABASE_URL=",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY=",
      "NEXT_PUBLIC_SITE_URL=",
      "SUPABASE_SERVICE_ROLE_KEY=",
      `APP_SLUG=${appSlug}`,
      `APP_DB_SCHEMA=${schemaName}`,
      "CRON_SECRET=",
      "APP_CRON_SECRET=",
      "RESEND_API_KEY=",
      "RESEND_FROM_EMAIL=",
      "RESEND_REPLY_TO=",
      ""
    ].join("\n")
  );

  writeFileIfChanged(path.join(targetDir, "README.md"), buildReadme({
    appSlug,
    displayName: safeDisplayName,
    schemaName,
    vercelProjectName
  }));

  writeFileIfChanged(path.join(targetDir, "scripts", "verify-config.mjs"), buildVerifyScript({
    appSlug,
    schemaName
  }));

  writeFileIfChanged(
    path.join(targetDir, "supabase", "migrations", "0001_app_schema.sql"),
    buildSchemaMigration(schemaName)
  );

  writeFileIfChanged(path.join(targetDir, "src", "lib", "supabase", "env.ts"), buildSupabaseEnv(schemaName));

  writeFileIfChanged(
    path.join(targetDir, "tsconfig.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: "ES2017",
          lib: ["dom", "dom.iterable", "esnext"],
          allowJs: false,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "bundler",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "preserve",
          incremental: true,
          plugins: [{ name: "next" }],
          baseUrl: ".",
          paths: {
            "@/*": ["./src/*"]
          }
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        exclude: ["node_modules"]
      },
      null,
      2
    )}\n`
  );

  writeFileIfChanged(
    path.join(targetDir, "next-env.d.ts"),
    '/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n\n// This file is managed by Next.js.\n'
  );

  writeFileIfChanged(
    path.join(targetDir, "next.config.ts"),
    'import type { NextConfig } from "next";\n\nconst nextConfig: NextConfig = {};\n\nexport default nextConfig;\n'
  );

  writeFileIfChanged(path.join(targetDir, "src", "app", "layout.tsx"), buildLayout({
    displayName: safeDisplayName,
    appSlug
  }));

  writeFileIfChanged(path.join(targetDir, "src", "app", "page.tsx"), buildPage({
    displayName: safeDisplayName,
    appSlug,
    schemaName
  }));

  writeFileIfChanged(path.join(targetDir, "src", "app", "globals.css"), buildGlobalsCss());

  writeFileIfChanged(
    path.join(targetDir, "spec", "pm-brief.md"),
    buildSpecPlaceholder("PM Brief", appSlug, "Paste the PM agent output here.")
  );
  writeFileIfChanged(
    path.join(targetDir, "spec", "design-brief.md"),
    buildSpecPlaceholder("Design Brief", appSlug, "Paste the Design agent output here.")
  );
  writeFileIfChanged(
    path.join(targetDir, "spec", "testing-brief.md"),
    buildSpecPlaceholder("Testing Brief", appSlug, "Paste the Testing agent output here.")
  );
  writeFileIfChanged(
    path.join(targetDir, "spec", "orchestrator-handoff.md"),
    buildSpecPlaceholder(
      "Orchestrator Handoff",
      appSlug,
      "Paste the Orchestrator agent handoff packet here."
    )
  );

  return {
    targetDir,
    appSlug,
    displayName: safeDisplayName,
    schemaName
  };
}

function pathExists(targetPath) {
  return Boolean(path.normalize(targetPath)) && fs.existsSync(targetPath);
}
