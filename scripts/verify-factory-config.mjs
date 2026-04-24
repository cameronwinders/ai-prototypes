import path from "node:path";

import { fileExists, getFactoryDefaults, loadFactoryEnv, requireKeys } from "./lib/factory-helpers.mjs";

const rootDir = process.cwd();
const env = loadFactoryEnv(rootDir);
const defaults = getFactoryDefaults(env);

const requiredFiles = [
  ".env.factory.example",
  "scripts/create-prototype.mjs",
  "scripts/provision-prototype.mjs",
  "scripts/generate-notion-agent-pack.mjs",
  "scripts/lib/factory-helpers.mjs",
  "scripts/lib/scaffold-prototype.mjs",
  "scripts/lib/factory-db.mjs",
  "scripts/lib/vercel-api.mjs",
  "scripts/lib/git-utils.mjs"
];

let failed = false;

for (const relativePath of requiredFiles) {
  if (!fileExists(path.join(rootDir, relativePath))) {
    console.error(`Missing required factory file: ${relativePath}`);
    failed = true;
  }
}

try {
  requireKeys(defaults, [
    "githubOwner",
    "githubRepo",
    "vercelToken",
    "sharedSupabaseUrl",
    "sharedSupabasePublishableKey",
    "sharedSupabaseServiceRoleKey",
    "sharedSupabaseDbUrl"
  ], "Factory automation");
} catch (error) {
  console.error(error.message);
  failed = true;
}

if (failed) {
  process.exit(1);
}

console.log("Factory config check passed.");
