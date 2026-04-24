import { parseArgs, readArg, slugify, titleCaseFromSlug } from "./lib/factory-helpers.mjs";
import { createPrototypeScaffold } from "./lib/scaffold-prototype.mjs";

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
const vercelProjectName = readArg(args, "project-name", `ai-prototypes-${appSlug}`);
const siteUrl = readArg(args, "site-url", `https://${vercelProjectName}.vercel.app`);

const result = createPrototypeScaffold({
  rootDir,
  appSlug,
  displayName,
  description,
  vercelProjectName,
  siteUrl
});

console.log(`Created prototype scaffold at ${result.targetDir}`);
