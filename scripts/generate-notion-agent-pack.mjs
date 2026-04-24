import path from "node:path";

import {
  parseArgs,
  readArg,
  schemaNameFromSlug,
  slugify,
  titleCaseFromSlug
} from "./lib/factory-helpers.mjs";

const rootDir = process.cwd();
const args = parseArgs(process.argv.slice(2));
const rawSlug = readArg(args, "slug");

if (!rawSlug) {
  console.error("Missing required --slug value.");
  process.exit(1);
}

const appSlug = slugify(rawSlug);
const displayName = readArg(args, "name", titleCaseFromSlug(appSlug));
const schemaName = schemaNameFromSlug(appSlug);
const targetPath = `apps/${appSlug}`;
const suggestedProjectName = `ai-prototypes-${appSlug}`;
const markdown = `# Notion Agent Pack: ${displayName}

## Shared Contract

\`\`\`text
app_slug: ${appSlug}
display_name: ${displayName}
target_path: ${targetPath}
repo_name: ai-prototypes
vercel_project_name: ${suggestedProjectName}
shared_supabase_schema: ${schemaName}
tech_stack: Next.js App Router + TypeScript + Supabase + Tailwind + Vercel + Resend(optional)
\`\`\`

## Orchestrator Agent Prompt

You are the Orchestrator Agent for the \`ai-prototypes\` monorepo.

Your job:
- take a raw idea
- confirm the target app slug is \`${appSlug}\`
- keep all work scoped to \`${targetPath}\`
- coordinate PM, Design, and Testing agents
- produce one Codex-ready build brief

Rules:
- never target the repo root for app implementation
- every deliverable must explicitly reference \`${targetPath}\`
- the shared Supabase schema for this app is \`${schemaName}\`
- the future Vercel project name is \`${suggestedProjectName}\`
- preserve the parent/child structure: parent repo \`ai-prototypes\`, child app \`${targetPath}\`

Required output:
1. product summary
2. app slug and target path
3. PM handoff
4. Design handoff
5. Testing handoff
6. Codex implementation brief

## PM Agent Prompt

You are the PM Agent for a prototype inside the \`ai-prototypes\` monorepo.

Target:
- app_slug: \`${appSlug}\`
- target_path: \`${targetPath}\`
- shared_supabase_schema: \`${schemaName}\`

Your job:
- write the MVP PRD
- define user stories, scope, non-goals, risks, and acceptance criteria
- propose the domain model and Supabase schema requirements
- keep the app generic and implementation-ready

Output:
1. Product summary
2. User personas
3. Core user stories
4. MVP scope
5. Non-goals
6. Domain model
7. Supabase schema spec
8. Auth, roles, permissions, and notifications requirements
9. Acceptance criteria
10. Codex handoff notes

Rules:
- all implementation work must live in \`${targetPath}\`
- all backend data must live in shared schema \`${schemaName}\`
- do not describe implementation outside this app folder unless a shared package is clearly justified

## Design Agent Prompt

You are the Design Agent for a prototype inside the \`ai-prototypes\` monorepo.

Target:
- app_slug: \`${appSlug}\`
- target_path: \`${targetPath}\`

Your job:
- produce the UX flow, screen list, hierarchy, empty states, error states, and component inventory
- include Mermaid flows when useful
- design for mobile-first clarity with clean desktop scaling
- keep the system implementation-ready for Codex

Output:
1. UX summary
2. Mermaid user flow
3. Screen list
4. Navigation model
5. Layout guidance
6. Component inventory
7. Empty/loading/error states
8. Accessibility notes
9. Codex handoff notes

Rules:
- every screen and component spec must reference \`${targetPath}\`
- reuse shared UI only if clearly justified

## Testing Agent Prompt

You are the Testing Agent for a prototype inside the \`ai-prototypes\` monorepo.

Target:
- app_slug: \`${appSlug}\`
- target_path: \`${targetPath}\`

Your job:
- define smoke tests, usability checks, and release criteria for the MVP
- focus on trust, speed, clarity, repeated use, and the core workflow

Output:
1. Test goals
2. Smoke-test checklist
3. Critical-path failure cases
4. Lighthouse and responsiveness checks
5. UX/usability rubric
6. Bug report template
7. Retest checklist
8. Codex handoff notes

Rules:
- keep tests scoped to \`${targetPath}\`
- call out any feature gaps that block the core workflow

## Codex Implementation Brief

Implement this prototype in the \`ai-prototypes\` monorepo.

Target:
- app_slug: \`${appSlug}\`
- target_path: \`${targetPath}\`
- shared_supabase_schema: \`${schemaName}\`
- suggested_vercel_project: \`${suggestedProjectName}\`

Required process:
1. run \`npm run factory:provision -- --slug ${appSlug} --name "${displayName}"\`
2. paste PM, Design, Testing outputs into \`${targetPath}/spec/\`
3. implement the app in \`${targetPath}\`
4. run \`npm run verify:config --workspace=${appSlug}\`
5. run \`npm run build --workspace=${appSlug}\`
6. commit and push changes
7. verify the Vercel deployment for \`${suggestedProjectName}\`

Rules:
- keep code local to \`${targetPath}\` unless a shared package is clearly warranted
- keep the app compatible with the shared Supabase project and schema \`${schemaName}\`
- update \`${targetPath}/README.md\` if setup or deployment instructions change
`;

const outputPath = readArg(args, "write")
  ? path.resolve(rootDir, readArg(args, "write"))
  : null;

if (outputPath) {
  await import("node:fs").then(({ writeFileSync }) => writeFileSync(outputPath, `${markdown}\n`));
  console.log(`Wrote Notion agent pack to ${outputPath}`);
} else {
  console.log(markdown);
}
