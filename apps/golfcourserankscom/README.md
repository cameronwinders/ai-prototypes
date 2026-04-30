# Golf Course Ranks

This prototype lives at `apps/golfcourserankscom` in the `ai-prototypes` monorepo.

## Factory Metadata

- app slug: `golfcourserankscom`
- schema: `app_golfcourserankscom_`
- Vercel project: `ai-prototypes-golfcourserankscom`
- shared backend: `prototype-backend.supabase.co`

## Product Summary

Golf Course Ranks is a leaderboard-first MVP for U.S. public golf courses. Golfers sign in with magic link auth, choose a handicap band, mark seeded courses as played, drag them into a personal order, and contribute ranking signal to a national crowd leaderboard.

## Core Routes

- `/` home with leaderboard preview and quick search
- `/leaderboard` national leaderboard with handicap/min-signal filters
- `/courses` seeded course browse and played toggles
- `/courses/[courseId]` course detail with trust cues, AI summary, and note editor
- `/me/courses` personal played/ranked list with drag-and-drop and keyboard reorder
- `/friends` friend requests by email
- `/compare/[friendUserId]` overlap-only compare view for accepted friendships
- `/feedback` feedback form
- `/admin/feedback` allowlisted feedback viewer

## Local Validation

Run from the monorepo root or this workspace:

```bash
npm run verify:config --workspace=golfcourserankscom
npm run typecheck --workspace=golfcourserankscom
npm run build --workspace=golfcourserankscom
npm run seed:courses --workspace=golfcourserankscom
```

Browser smoke coverage lives in `scripts/playwright-smoke.mjs`. It relies on a local-only test session route that is only enabled when `SMOKE_TEST_SECRET` is present at runtime.

## Supabase Notes

- Apply migrations in `supabase/migrations/`
- Seed source CSV: `supabase/seeds/course-catalog.csv`
- The seed script writes `seed_source` JSON, `seed_score`, and refreshes `course_aggregates`

## Deployment Notes

- Vercel root directory: `apps/golfcourserankscom`
- Canonical production URL: `https://golfcourseranks.com`
- Keep `SMOKE_TEST_SECRET` unset in production
