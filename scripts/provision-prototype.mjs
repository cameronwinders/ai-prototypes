import path from "node:path";

import {
  expandTemplate,
  getFactoryDefaults,
  hasFlag,
  loadFactoryEnv,
  parseArgs,
  randomSecret,
  readArg,
  requireKeys,
  schemaNameFromSlug,
  slugify,
  titleCaseFromSlug
} from "./lib/factory-helpers.mjs";
import { applyAppMigrations } from "./lib/factory-db.mjs";
import { createPrototypeScaffold } from "./lib/scaffold-prototype.mjs";
import { commitAndPush, getCurrentBranch } from "./lib/git-utils.mjs";
import { createVercelProject, getVercelProject, upsertProjectEnv } from "./lib/vercel-api.mjs";

const rootDir = process.cwd();
const args = parseArgs(process.argv.slice(2));
const rawSlug = readArg(args, "slug");

if (!rawSlug) {
  console.error("Missing required --slug value.");
  process.exit(1);
}

const appSlug = slugify(rawSlug);
if (!appSlug) {
  console.error("Could not derive a valid slug from the provided value.");
  process.exit(1);
}

const displayName = readArg(args, "name", titleCaseFromSlug(appSlug));
const description = readArg(args, "description", "");
const env = loadFactoryEnv(rootDir);
const defaults = getFactoryDefaults(env);
const schemaName = schemaNameFromSlug(appSlug);
const vercelProjectName =
  readArg(args, "project-name") ?? `${defaults.vercelProjectPrefix}${appSlug}`;
const siteUrl =
  readArg(args, "site-url") ??
  expandTemplate(defaults.siteUrlPattern, {
    project: vercelProjectName,
    slug: appSlug
  });
const shouldPush = !hasFlag(args, "no-push");
const shouldProvisionDb = !hasFlag(args, "skip-db");
const shouldProvisionVercel = !hasFlag(args, "skip-vercel");

if (shouldProvisionDb) {
  requireKeys(defaults, ["sharedSupabaseDbUrl"], "Database provisioning");
}

if (shouldProvisionVercel) {
  requireKeys(defaults, ["vercelToken", "githubOwner", "githubRepo"], "Vercel provisioning");
}

const appDir = path.join(rootDir, "apps", appSlug);
const existingProject = shouldProvisionVercel
  ? await getVercelProject(
      {
        token: defaults.vercelToken,
        teamSlug: defaults.vercelTeamSlug
      },
      vercelProjectName
    )
  : null;

const scaffoldResult = createPrototypeScaffold({
  rootDir,
  appSlug,
  displayName,
  description,
  vercelProjectName,
  siteUrl,
  sharedSupabaseProjectRef: defaults.sharedSupabaseProjectRef,
  force: false
});

const vercelEnvVariables = buildVercelEnv({
  appSlug,
  schemaName,
  siteUrl,
  defaults
});

if (shouldProvisionDb) {
  await applyAppMigrations({
    connectionString: defaults.sharedSupabaseDbUrl,
    appDir,
    appSlug,
    displayName,
    schemaName,
    vercelProjectName,
    siteUrl
  });
}

const branch = getCurrentBranch(rootDir);

if (!shouldProvisionVercel) {
  if (shouldPush) {
    commitAndPush(rootDir, `Provision prototype ${appSlug}`, branch);
  }
} else if (existingProject) {
  await upsertProjectEnv(
    {
      token: defaults.vercelToken,
      teamSlug: defaults.vercelTeamSlug
    },
    vercelProjectName,
    vercelEnvVariables
  );

  if (shouldPush) {
    commitAndPush(rootDir, `Provision prototype ${appSlug}`, branch);
  }
} else {
  if (!shouldPush) {
    throw new Error(
      `Vercel project ${vercelProjectName} does not exist yet. Re-run without --no-push so the app folder is on GitHub before project creation.`
    );
  }

  commitAndPush(rootDir, `Provision prototype ${appSlug}`, branch);

  await createVercelProject(
    {
      token: defaults.vercelToken,
      teamSlug: defaults.vercelTeamSlug
    },
    {
      name: vercelProjectName,
      framework: "nextjs",
      rootDirectory: `apps/${appSlug}`,
      environmentVariables: vercelEnvVariables,
      gitRepository: {
        type: "github",
        repo: `${defaults.githubOwner}/${defaults.githubRepo}`
      },
      nodeVersion: "20.x"
    }
  );

  await upsertProjectEnv(
    {
      token: defaults.vercelToken,
      teamSlug: defaults.vercelTeamSlug
    },
    vercelProjectName,
    vercelEnvVariables
  );
}
console.log(
  JSON.stringify(
    {
      appSlug,
      displayName,
      schemaName,
      appDir,
      vercelProjectName,
      siteUrl,
      githubRepo:
        defaults.githubOwner && defaults.githubRepo
          ? `${defaults.githubOwner}/${defaults.githubRepo}`
          : null,
      branch,
      vercelProvisioned: shouldProvisionVercel,
      databaseProvisioned: shouldProvisionDb,
      pushed: shouldPush,
      note: "If this was a brand-new Vercel project, the initial deployment should begin automatically from the latest pushed commit."
    },
    null,
    2
  )
);

function buildVercelEnv({ appSlug, schemaName, siteUrl, defaults }) {
  const cronSecret = randomSecret(24);
  const targets = ["production", "preview", "development"];

  const entries = [
    makeEnv("NEXT_PUBLIC_SUPABASE_URL", defaults.sharedSupabaseUrl, targets, "plain"),
    makeEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      defaults.sharedSupabasePublishableKey,
      targets,
      "encrypted"
    ),
    makeEnv("NEXT_PUBLIC_SITE_URL", siteUrl, targets, "plain"),
    makeEnv(
      "SUPABASE_SERVICE_ROLE_KEY",
      defaults.sharedSupabaseServiceRoleKey,
      targets,
      "encrypted"
    ),
    makeEnv("APP_SLUG", appSlug, targets, "plain"),
    makeEnv("APP_DB_SCHEMA", schemaName, targets, "plain"),
    makeEnv("CRON_SECRET", cronSecret, targets, "encrypted"),
    makeEnv("APP_CRON_SECRET", cronSecret, targets, "encrypted")
  ];

  if (defaults.sharedSupabaseAnonKey) {
    entries.push(
      makeEnv(
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        defaults.sharedSupabaseAnonKey,
        targets,
        "encrypted"
      )
    );
  }

  if (defaults.resendApiKey) {
    entries.push(makeEnv("RESEND_API_KEY", defaults.resendApiKey, targets, "encrypted"));
  }

  if (defaults.resendFromEmail) {
    entries.push(makeEnv("RESEND_FROM_EMAIL", defaults.resendFromEmail, targets, "plain"));
  }

  if (defaults.resendReplyTo) {
    entries.push(makeEnv("RESEND_REPLY_TO", defaults.resendReplyTo, targets, "plain"));
  }

  return entries;
}

function makeEnv(key, value, target, type) {
  return {
    key,
    value,
    target,
    type
  };
}
