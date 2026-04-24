# Creator App Studio

Creator App Studio is a premium single-page marketing site for a service that helps SMB creators launch branded web apps and paid audience experiences.

## App Contract

- App path: `apps/creator-app-studio`
- App slug: `creator-app-studio`
- Shared Supabase schema: `app_creator_app_studio`
- Vercel project: `ai-prototypes-creator-app-studio`

## MVP Scope

- Premium single-page landing site with anchor navigation
- Editorial hero and abstract product canvas
- App type grid, vertical examples, process, partnership, and trust sections
- Supabase-backed lead capture form with server-side validation
- Graceful submit failure when environment variables are missing

## Local Checks

Run from this app directory or invoke the same scripts through the monorepo:

```bash
node scripts/verify-config.mjs
node ../../node_modules/typescript/lib/tsc.js --noEmit -p tsconfig.json
node ../../node_modules/next/dist/bin/next build
```

## Environment

Copy `.env.example` to `.env.local` and provide:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_SLUG=creator-app-studio`
- `APP_DB_SCHEMA=app_creator_app_studio`

The form can fall back to the public Supabase key, but the service role key is preferred for server-side inserts.

## Database

App schema migration files live in `supabase/migrations/`.

- `0001_app_schema.sql` creates the app schema and grants
- `0002_leads_and_examples.sql` creates lead capture tables and RLS policies

## Deployment Notes

- Root directory on Vercel: `apps/creator-app-studio`
- Public site target: `https://ai-prototypes-creator-app-studio.vercel.app`
- The landing page remains readable even if Supabase env vars are missing
