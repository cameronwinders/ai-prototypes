# App Factory Runbook

The app factory turns a new idea into a live child app inside the `ai-prototypes` parent monorepo with:

- `apps/[slug]` scaffold creation
- shared Supabase schema provisioning
- Vercel project creation or update
- environment variable injection
- git commit + push
- first live deployment through Git-connected Vercel

## One-Time Setup

1. Copy `.env.factory.example` to `.env.factory.local`.
2. Fill in:
   - GitHub owner and repo
   - Vercel token and team slug
   - shared Supabase URL, publishable key, service role key, database URL, and project ref
   - optional Resend settings
3. Run:

```bash
npm run factory:check
```

## Provision a New Prototype

Run:

```bash
npm run factory:provision -- --slug=my-new-idea --name="My New Idea"
```

Default behavior:

- creates a buildable child app scaffold at `apps/my-new-idea`
- applies any app migrations in `apps/my-new-idea/supabase/migrations`
- commits and pushes to the current branch
- creates or updates the Vercel project
- injects shared backend + app-specific env vars into the Vercel project

Optional flags:

- `--no-push` - scaffold and provision locally without committing or pushing
- `--skip-db` - skip shared Supabase migration application
- `--skip-vercel` - skip Vercel project/env provisioning
- `--project-name=custom-project-name` - override the default Vercel project name
- `--site-url=https://custom-domain.example` - override the default public site URL
- `--description="..."` - store a short app description in `prototype.config.json`

## What the Factory Writes

Each new child app receives:

- `prototype.config.json`
- `package.json`
- `.env.example`
- `README.md`
- `spec/pm-brief.md`
- `spec/design-brief.md`
- `spec/testing-brief.md`
- `spec/orchestrator-handoff.md`
- `scripts/verify-config.mjs`
- `supabase/migrations/0001_app_schema.sql`
- minimal buildable Next.js App Router files

## Shared Supabase Model

All prototype data lives inside the shared Supabase project, but each child app gets its own schema:

- `apps/caretaking` -> `app_caretaking`
- `apps/todo-prototype` -> `app_todo_prototype`

The factory tracks applied SQL in:

- `public.prototype_factory_migrations`
- `public.prototype_factory_apps`

## Git + Vercel Flow

- For an existing Vercel child project: env vars are updated first, then the push triggers the next deployment.
- For a brand-new Vercel child project: the factory pushes first, then creates the project so the initial import deploy can succeed from the latest commit.

## Notion Agent Handoff

Generate a ready-to-paste Notion prompt pack for a target slug:

```bash
npm run factory:handoff -- --slug=my-new-idea --name="My New Idea"
```

Write the generated prompt pack to a file:

```bash
npm run factory:handoff -- --slug=my-new-idea --name="My New Idea" --write=docs/my-new-idea-agent-pack.md
```
