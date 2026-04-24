# Next Supabase Prototype Template

This folder documents the baseline conventions for new prototypes created inside the `ai-prototypes` monorepo.

Each prototype should be created in `apps/[slug]` through the factory and should include:

- `prototype.config.json`
- app-local `package.json`
- app-local `.env.example`
- app-local `README.md`
- app-local `spec/` placeholders for PM, Design, Testing, and Orchestrator briefs
- app-local `supabase/migrations`
- a clear `APP_DB_SCHEMA` value for the shared Supabase Option B model
- a minimal buildable Next.js App Router scaffold
