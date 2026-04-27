# Deployment Notes

Target app: `apps/creator-app-studio`

## Account + Admin MVP Additions

- Added Supabase magic-link auth entrypoint at `/sign-in`
- Added protected creator account page at `/account`
- Added protected internal admin page at `/admin`
- Added auth callback route at `/api/auth/callback`

## Data Model

- `app_creator_app_studio.accounts`
- `app_creator_app_studio.admin_allowlist`
- `app_creator_app_studio.leads.account_id`
- Seeded admin allowlist email: `cameronwinders@gmail.com`

## Environment Requirements

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `APP_DB_SCHEMA=app_creator_app_studio`

## Deployment Notes

- Creator self-service sign-in depends on Supabase Auth redirecting back to `/api/auth/callback`
- Lead-form auto-provision depends on `SUPABASE_SERVICE_ROLE_KEY`
- Demo URLs are admin-managed and creator-visible in v1
