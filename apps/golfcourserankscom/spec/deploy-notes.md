# Deploy Notes

Target app: `apps/golfcourserankscom`

## Production URL

- Canonical public URL: `https://golfcourseranks.com`
- Vercel project: `ai-prototypes-golfcourserankscom`
- Shared schema: `app_golfcourserankscom_`

## Deployment Status

- Vercel project provisioned and linked to `cameronwinders/ai-prototypes`
- Production deployment created from commit `03662917b007906d6ab7c7f5c34931516cad7659`
- Public production alias responds without login

## Live Checks

- `/` returns `200`
- `/leaderboard` returns `200`
- `/courses` returns `200`
- `/feedback` returns `200`
- `/admin/feedback` stays guarded and redirects anonymous traffic to sign-in

## Notes

- Deployment preview URLs still inherit Vercel account protection defaults, but the canonical production alias is publicly accessible
- `SMOKE_TEST_SECRET` is intended for local validation only and should remain unset in production
