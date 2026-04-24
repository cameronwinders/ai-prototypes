import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export function parseArgs(argv) {
  const parsed = {
    _: []
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (!current.startsWith("--")) {
      parsed._.push(current);
      continue;
    }

    const [rawKey, rawValue] = current.slice(2).split("=", 2);
    const key = rawKey.trim();

    if (!key) {
      continue;
    }

    if (rawValue !== undefined) {
      parsed[key] = rawValue;
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      parsed[key] = next;
      index += 1;
      continue;
    }

    parsed[key] = true;
  }

  return parsed;
}

export function hasFlag(args, key) {
  return Boolean(args[key]);
}

export function readArg(args, key, fallback = undefined) {
  return args[key] ?? fallback;
}

export function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function titleCaseFromSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function schemaNameFromSlug(slug) {
  return `app_${slug.replace(/-/g, "_")}`;
}

export function ensureDir(targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
}

export function fileExists(targetPath) {
  return fs.existsSync(targetPath);
}

export function writeFileIfChanged(targetPath, contents) {
  const current = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, "utf8") : null;

  if (current === contents) {
    return false;
  }

  ensureDir(path.dirname(targetPath));
  fs.writeFileSync(targetPath, contents);
  return true;
}

export function readJson(targetPath, fallback = null) {
  if (!fs.existsSync(targetPath)) {
    return fallback;
  }

  return JSON.parse(fs.readFileSync(targetPath, "utf8"));
}

export function writeJson(targetPath, value) {
  writeFileIfChanged(targetPath, `${JSON.stringify(value, null, 2)}\n`);
}

export function readEnvFile(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return {};
  }

  const result = {};
  const contents = fs.readFileSync(targetPath, "utf8");

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();

    if (!key) {
      continue;
    }

    const unquoted =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue;

    result[key] = unquoted;
  }

  return result;
}

export function loadFactoryEnv(rootDir) {
  const fileEnv = {
    ...readEnvFile(path.join(rootDir, ".env.factory")),
    ...readEnvFile(path.join(rootDir, ".env.factory.local"))
  };

  return {
    ...fileEnv,
    ...process.env
  };
}

export function requireKeys(env, keys, contextLabel) {
  const missing = keys.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(
      `${contextLabel} is missing required environment variables: ${missing.join(", ")}`
    );
  }
}

export function randomSecret(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function expandTemplate(value, replacements) {
  return Object.entries(replacements).reduce((result, [key, replacement]) => {
    return result.replaceAll(`{${key}}`, replacement);
  }, value);
}

export function sortMigrationNames(fileNames) {
  return [...fileNames].sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
}

export function getTemplateDependencyVersions(rootDir) {
  const caretakingPackage = readJson(path.join(rootDir, "apps", "caretaking", "package.json"));

  if (!caretakingPackage) {
    throw new Error("Could not read apps/caretaking/package.json for template dependency versions.");
  }

  return {
    dependencies: {
      next: caretakingPackage.dependencies?.next ?? "15.5.15",
      react: caretakingPackage.dependencies?.react ?? "19.0.0",
      "react-dom": caretakingPackage.dependencies?.["react-dom"] ?? "19.0.0",
      "@supabase/ssr": caretakingPackage.dependencies?.["@supabase/ssr"] ?? "0.7.0",
      "@supabase/supabase-js":
        caretakingPackage.dependencies?.["@supabase/supabase-js"] ?? "2.103.2"
    },
    devDependencies: {
      typescript: caretakingPackage.devDependencies?.typescript ?? "5.8.3",
      "@types/node": caretakingPackage.devDependencies?.["@types/node"] ?? "22.14.1",
      "@types/react": caretakingPackage.devDependencies?.["@types/react"] ?? "19.0.10",
      "@types/react-dom": caretakingPackage.devDependencies?.["@types/react-dom"] ?? "19.0.4"
    }
  };
}

export function getFactoryDefaults(env) {
  return {
    githubOwner: env.FACTORY_GITHUB_OWNER,
    githubRepo: env.FACTORY_GITHUB_REPO,
    vercelToken: env.VERCEL_TOKEN,
    vercelTeamSlug: env.FACTORY_VERCEL_TEAM_SLUG ?? "",
    vercelProjectPrefix: env.FACTORY_VERCEL_PROJECT_PREFIX ?? "ai-prototypes-",
    defaultBranch: env.FACTORY_DEFAULT_BRANCH ?? "main",
    sharedSupabaseUrl: env.FACTORY_SHARED_SUPABASE_URL,
    sharedSupabasePublishableKey: env.FACTORY_SHARED_SUPABASE_PUBLISHABLE_KEY,
    sharedSupabaseAnonKey: env.FACTORY_SHARED_SUPABASE_ANON_KEY ?? "",
    sharedSupabaseServiceRoleKey: env.FACTORY_SHARED_SUPABASE_SERVICE_ROLE_KEY,
    sharedSupabaseDbUrl: env.FACTORY_SHARED_SUPABASE_DB_URL,
    sharedSupabaseProjectRef: env.FACTORY_SHARED_SUPABASE_PROJECT_REF ?? "",
    siteUrlPattern:
      env.FACTORY_DEFAULT_SITE_URL_PATTERN ?? "https://{project}.vercel.app",
    resendApiKey: env.FACTORY_RESEND_API_KEY ?? "",
    resendFromEmail: env.FACTORY_RESEND_FROM_EMAIL ?? "",
    resendReplyTo: env.FACTORY_RESEND_REPLY_TO ?? ""
  };
}
