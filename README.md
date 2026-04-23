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

Suggested future schema naming:

- `apps/caretaking` -> `app_caretaking`
- `apps/todo-prototype` -> `app_todo_prototype`

## Deployment Model

- GitHub repo: `cameronwinders/ai-prototypes`
- Vercel project per child app
- root directory per deployment: `apps/[slug]`
- preview and production env vars set per Vercel project

## One-Time Manual Bootstrap

Complete once:

1. Create the private `ai-prototypes` GitHub repo.
2. Create a GitHub automation token with repository write access.
3. Create the shared Supabase project.
4. Configure shared Supabase Auth redirect URLs.
5. Create a Vercel token and connect Vercel to GitHub.

## Next Manual Steps

After local structure is ready:

1. Put the `ai-prototypes` repo URL on the new local folder.
2. Run `npm install` at the monorepo root to create the new root lockfile.
3. Push the monorepo to GitHub.
4. Import `apps/caretaking` into Vercel using root directory `apps/caretaking`.
5. Add `apps/caretaking` environment variables in Vercel.

## Agent Contract

Every PM, Design, Testing, and Codex handoff should include:

```text
app_slug: caretaking
target_path: apps/caretaking
repo_name: ai-prototypes
deployment_root: apps/caretaking
shared_supabase_schema: app_caretaking
```
