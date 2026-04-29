# Orchestrator Handoff

Target app: `apps/golfcourserankscom`

## Current MVP Scope

- Premium leaderboard-first UI for seeded U.S. public courses
- Shared-schema Supabase backend with private played/rank data
- Cached aggregate leaderboard plus handicap-band filtered dynamic view
- AI summary scaffolding with low-data protection
- Admin-only feedback review surface

## Operational Notes

- Production root directory should stay `apps/golfcourserankscom`
- Keep `SMOKE_TEST_SECRET` local-only
- Supabase service-role access is required for aggregate refreshes and admin viewer reads
- Seed catalog is curated in `supabase/seeds/course-catalog.csv`

## Remaining Product Risks

- Seed quality is curated but still hand-maintained, so some public-access assumptions may need future editorial review
- Course summary quality is intentionally conservative until richer note volume exists
- Compare remains overlap-only and intentionally avoids any public social feed behavior
