# Notion Agent Setup

Use the factory-generated prompt pack as the source of truth for PM, Design, Testing, and Orchestrator agents.

## Core Rule

Every agent must target a specific child app path:

```text
apps/[slug]
```

Never target the repo root.

## Recommended Flow

1. Choose the app slug.
2. Run:

```bash
npm run factory:handoff -- --slug=<slug> --name="<Display Name>"
```

3. Paste the generated markdown into Notion.
4. Create or update these agents in Notion:
   - Orchestrator Agent
   - PM Agent
   - Design Agent
   - Testing Agent
5. Give all four agents the generated shared contract block.
6. Let the Orchestrator combine their outputs into one Codex-ready implementation brief.
7. Run:

```bash
npm run factory:provision -- --slug=<slug> --name="<Display Name>"
```

8. Hand the generated Notion briefs to Codex for implementation.

## Required Shared Contract Fields

```text
app_slug
display_name
target_path
repo_name
vercel_project_name
shared_supabase_schema
tech_stack
```

## Implementation Rule for Codex

Codex should:

1. scaffold + provision the child app through the factory
2. paste agent outputs into `apps/[slug]/spec/`
3. implement the product in `apps/[slug]/`
4. run config/build checks
5. push the changes so Vercel deploys the child app
