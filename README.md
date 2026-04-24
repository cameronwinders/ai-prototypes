# AI Prototypes

`ai-prototypes` is the parent monorepo for fast, isolated product experiments.

Current prototype children:

- `apps/caretaking` - shared caretaking app and prototype #1

## Monorepo Rules

- Every idea lives in `apps/[slug]`.
- Vercel deploys each app from its own root directory, for example `apps/caretaking`.
- Option B backend model: one shared Supabase project, one Postgres schema per prototype.
- Keep app-specific migrations, README instructions, and environment examples inside each app folder.
- Only move code into `shared/` when a second app genuinely needs it.

## Root Commands

```bash
npm install
npm run factory:check
npm run factory:provision -- --slug=my-new-idea --name="My New Idea"
npm run factory:handoff -- --slug=my-new-idea --name="My New Idea"
npm run dev:caretaking
npm run typecheck:caretaking
npm run build:caretaking
npm run create:prototype -- --slug=my-new-idea
```

## Shared Supabase Convention

Use one shared Supabase project such as `ai-prototypes-platform`.

Each prototype gets:

- app slug: `caretaking`
- schema name: `app_caretaking`
- optional env variable: `APP_DB_SCHEMA=app_caretaking`

Runtime rule:

- each child app must point its Supabase clients at `APP_DB_SCHEMA`
- each child app migration set should create its own schema from day one, or include a compatibility migration that moves legacy `public` objects into the app schema

Suggested future schema naming:

- `apps/caretaking` -> `app_caretaking`
- `apps/todo-prototype` -> `app_todo_prototype`

## Deployment Model

- GitHub repo: `cameronwinders/ai-prototypes`
- Vercel project per child app
- root directory per deployment: `apps/[slug]`
- preview and production env vars set per Vercel project

## Factory Automation

The repo now includes an app factory layer:

- `.env.factory.example` - one-time automation env contract
- `scripts/provision-prototype.mjs` - scaffold + shared-Supabase + Vercel provisioning
- `scripts/generate-notion-agent-pack.mjs` - creates a Notion-ready PM/Design/Testing/Orchestrator prompt pack
- `docs/app-factory.md` - runbook for the zero-manual new-app flow

Recommended flow for a new idea:

1. Generate the Notion agent pack for the target slug.
2. Run the PM, Design, Testing, and Orchestrator agents.
3. Run `npm run factory:provision -- --slug=<slug> --name="<Display Name>"`.
4. Hand the resulting `apps/<slug>/spec/` briefs to Codex for implementation.

## One-Time Manual Bootstrap

Complete once:

1. Create the private `ai-prototypes` GitHub repo.
2. Create a GitHub automation token with repository write access.
3. Create the shared Supabase project.
4. Configure shared Supabase Auth redirect URLs.
5. Create a Vercel token and connect Vercel to GitHub.
6. Copy `.env.factory.example` to `.env.factory.local` and fill in the tokens/URLs.

## Next Manual Steps

Once the one-time bootstrap is complete, new child apps should not require manual Vercel or Supabase setup.
The only expected human steps are:

1. Decide the idea slug and display name.
2. Run the Notion agents using the generated prompt pack.
3. Review the resulting MVP brief before Codex implementation if desired.

## Agent Contract

Every PM, Design, Testing, and Codex handoff should include:

```text
app_slug: caretaking
target_path: apps/caretaking
repo_name: ai-prototypes
deployment_root: apps/caretaking
shared_supabase_schema: app_caretaking
```
