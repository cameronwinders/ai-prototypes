import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const args = process.argv.slice(2);

function readArg(name) {
  const prefix = `--${name}=`;
  const valueArg = args.find((arg) => arg.startsWith(prefix));
  if (valueArg) {
    return valueArg.slice(prefix.length);
  }

  const flagIndex = args.findIndex((arg) => arg === `--${name}`);
  if (flagIndex >= 0) {
    return args[flagIndex + 1];
  }

  return undefined;
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const rawSlug = readArg("slug");

if (!rawSlug) {
  console.error("Missing required --slug value.");
  process.exit(1);
}

const appSlug = slugify(rawSlug);

if (!appSlug) {
  console.error("Could not derive a valid slug from the provided value.");
  process.exit(1);
}

const targetDir = path.join(rootDir, "apps", appSlug);

if (fs.existsSync(targetDir)) {
  console.error(`Prototype already exists at ${targetDir}`);
  process.exit(1);
}

fs.mkdirSync(path.join(targetDir, "src", "app"), { recursive: true });
fs.mkdirSync(path.join(targetDir, "scripts"), { recursive: true });
fs.mkdirSync(path.join(targetDir, "supabase", "migrations"), { recursive: true });

const schemaName = `app_${appSlug.replace(/-/g, "_")}`;

fs.writeFileSync(
  path.join(targetDir, "package.json"),
  JSON.stringify(
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
      }
    },
    null,
    2
  ) + "\n"
);

fs.writeFileSync(
  path.join(targetDir, ".env.example"),
  [
    "NEXT_PUBLIC_SUPABASE_URL=",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=",
    "NEXT_PUBLIC_SITE_URL=",
    "SUPABASE_SERVICE_ROLE_KEY=",
    `APP_SLUG=${appSlug}`,
    `APP_DB_SCHEMA=${schemaName}`,
    "CRON_SECRET=",
    "RESEND_API_KEY=",
    "RESEND_FROM_EMAIL=",
    ""
  ].join("\n")
);

fs.writeFileSync(
  path.join(targetDir, "README.md"),
  `# ${appSlug}\n\nPrototype scaffold for \`apps/${appSlug}\`.\n\n## Shared Supabase\n\n- app slug: \`${appSlug}\`\n- schema: \`${schemaName}\`\n\n## Next Steps\n\n1. Add the PRD, design spec, and testing brief for this prototype.\n2. Install app dependencies.\n3. Implement the Next.js app in this folder.\n4. Create Vercel project with root directory \`apps/${appSlug}\`.\n`
);

fs.writeFileSync(
  path.join(targetDir, "scripts", "verify-config.mjs"),
  'console.log("Add prototype-specific config verification here.");\n'
);

fs.writeFileSync(
  path.join(targetDir, "src", "app", "page.tsx"),
  `export default function Home() {\n  return (\n    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>\n      <h1>${appSlug}</h1>\n      <p>Prototype scaffold created in apps/${appSlug}.</p>\n    </main>\n  );\n}\n`
);

console.log(`Created prototype scaffold at apps/${appSlug}`);
