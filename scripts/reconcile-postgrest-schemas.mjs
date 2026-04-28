import { getFactoryDefaults, loadFactoryEnv, parseArgs, readArg, requireKeys, schemaNameFromSlug, slugify, titleCaseFromSlug } from "./lib/factory-helpers.mjs";
import { reconcilePostgrestSchemas, upsertPrototypeApp } from "./lib/factory-db.mjs";

const rootDir = process.cwd();
const env = loadFactoryEnv(rootDir);
const defaults = getFactoryDefaults(env);
const args = parseArgs(process.argv.slice(2));

requireKeys(defaults, ["sharedSupabaseDbUrl"], "PostgREST schema reconciliation");

const rawSlug = readArg(args, "slug");

if (rawSlug) {
  const appSlug = slugify(rawSlug);

  if (!appSlug) {
    console.error("Could not derive a valid slug from the provided value.");
    process.exit(1);
  }

  const displayName = readArg(args, "name", titleCaseFromSlug(appSlug));
  const schemaName = readArg(args, "schema", schemaNameFromSlug(appSlug));
  const repoPath = readArg(args, "repo-path", `apps/${appSlug}`);
  const vercelProjectName =
    readArg(args, "project-name") ?? `${defaults.vercelProjectPrefix}${appSlug}`;
  const siteUrl = readArg(args, "site-url", "");

  const desiredSchemas = await upsertPrototypeApp({
    connectionString: defaults.sharedSupabaseDbUrl,
    appSlug,
    displayName,
    schemaName,
    repoPath,
    vercelProjectName,
    siteUrl
  });

  console.log(
    JSON.stringify(
      {
        action: "registered-and-reconciled",
        appSlug,
        displayName,
        schemaName,
        repoPath,
        vercelProjectName,
        siteUrl,
        desiredSchemas
      },
      null,
      2
    )
  );
} else {
  const desiredSchemas = await reconcilePostgrestSchemas({
    connectionString: defaults.sharedSupabaseDbUrl
  });

  console.log(
    JSON.stringify(
      {
        action: "reconciled",
        desiredSchemas
      },
      null,
      2
    )
  );
}
