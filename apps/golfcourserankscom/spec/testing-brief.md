# Testing Brief

Target app: `apps/golfcourserankscom`

## Validation Layers

### Static and build

- `verify:config`
- `tsc --noEmit`
- `next build`

### Runtime and data

- shared Supabase migrations applied to `prototype-backend.supabase.co`
- PostgREST schema reconciliation completed for `app_golfcourserankscom_`
- 200-course seed import completed

### Browser smoke

Covered with Playwright + Chromium:

- sign-in bootstrap and session persistence
- handicap-band onboarding persistence
- course browse/search
- mark played from course detail
- ranking add flow and drag reorder persistence after refresh
- leaderboard seeded/early label
- course note persistence
- feedback submission and admin viewer access
- friend request, accept, compare gating
- mobile shell smoke on leaderboard and My Courses

## Must-Fix Watchouts

- auth callback/session regressions
- duplicate or conflicting rank positions on rapid reorder
- missing seeded/early trust cues on the leaderboard
- friendship privacy leaks
- admin feedback access escaping the allowlist guard
