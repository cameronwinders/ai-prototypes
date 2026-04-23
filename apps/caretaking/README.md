# Caretaking App

This app now lives inside the `ai-prototypes` monorepo at `apps/caretaking`.

A generic shared caretaking web app built with Next.js App Router, TypeScript, Supabase Auth/Postgres/RLS/RPCs, Resend transactional email delivery, and in-app notifications.

The product model stays domain-agnostic: spaces, members, subjects, event types, events, reminders, notifications, and audit logs.

## Monorepo Notes

- App slug: `caretaking`
- Target path: `apps/caretaking`
- Shared Supabase schema target for the parent platform model: `app_caretaking`
- Vercel root directory for this app: `apps/caretaking`

## Deployment Status

The app has been verified through dependency install, config checks, typecheck, production build, hosted Supabase migrations, Supabase Auth URL configuration, and Vercel deployment. Full local Supabase verification still requires Docker Desktop to be running. Full live invite smoke testing requires production Resend environment variables to be configured.

## Prerequisites

- Node.js 20.x or newer
- npm 10.x or newer
- Docker Desktop for the local Supabase stack
- Supabase CLI, either through `npx supabase` or a global install
- A Supabase project for production
- A Vercel project for the Next.js app
- A Resend API key and verified sender/domain for invite and activity email delivery

## Local Setup

Clone the repo, install dependencies, and run the static config check:

```bash
npm install
npm run verify:config
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Use these variables for local development:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local anon key from supabase start>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<optional fallback local anon key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=<local service_role key from supabase start>
CRON_SECRET=<random local secret>
APP_CRON_SECRET=<optional fallback secret>
RESEND_API_KEY=<resend api key>
RESEND_FROM_EMAIL=<verified sender, for example Caretaking App <hello@caretakingapp.com>>
RESEND_REPLY_TO=<optional reply-to email>
```

Notes:

- Prefer `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for new Supabase projects.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` remains supported as a fallback.
- Prefer `CRON_SECRET` on Vercel because Vercel automatically sends it as a bearer token to cron routes.
- `APP_CRON_SECRET` remains supported for manual calls or alternate schedulers using `x-cron-secret`.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

## Supabase Local Stack

Start Supabase locally:

```bash
npx supabase start
```

Copy the local API URL, anon/publishable key, and service role key into `.env.local`.

Apply migrations from a clean local database:

```bash
npx supabase db reset
```

The deployable migration order is:

```text
supabase/migrations/0001_core_schema.sql
supabase/migrations/0002_seed_roles.sql
supabase/migrations/0003_hardening_rpc_and_delivery.sql
supabase/migrations/0004_final_rls_and_safety.sql
supabase/migrations/0005_onboarding_user_space_index.sql
supabase/migrations/0006_invite_digest_extension.sql
supabase/migrations/0007_profiles_and_reminder_completion.sql
supabase/migrations/0008_repeat_reminders_and_auth_callback.sql
supabase/migrations/0009_transactional_email_preferences.sql
```

`supabase/policies` is retained as policy history/reference only. The final deployable RLS state is in `supabase/migrations/0004_final_rls_and_safety.sql`.

## Run Locally

Start the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Before deploying, run:

```bash
npm run verify:config
npm run typecheck
npm run build
```

## Production Supabase Deployment

Create or choose a Supabase project, then link it:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
```

Preview the migration push:

```bash
npx supabase db push --dry-run
```

Apply migrations:

```bash
npx supabase db push
```

Confirm these RPCs exist in the production project:

```text
create_space_mvp
create_invite_mvp
record_invite_delivery_mvp
accept_invite_mvp
create_event_mvp
create_reminder_mvp
process_due_reminders_mvp
mark_notification_read_mvp
complete_reminder_mvp
```

In Supabase Auth settings:

- Enable email OTP/magic-link sign-in.
- Set Site URL to the production app URL, for example `https://your-app.vercel.app`.
- Add `https://your-app.vercel.app/api/auth/callback` to Redirect URLs.
- Keep `http://localhost:3000/api/auth/callback` for local development.

## Vercel Deployment

Import the repo into Vercel and set the framework preset to Next.js.

Use these production environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=<production Supabase project URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<production Supabase publishable key>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<optional fallback production anon key>
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
SUPABASE_SERVICE_ROLE_KEY=<production Supabase service_role key>
CRON_SECRET=<random production secret, at least 16 characters>
APP_CRON_SECRET=<optional fallback; can match CRON_SECRET>
RESEND_API_KEY=<production Resend API key>
RESEND_FROM_EMAIL=<verified production sender, for example Caretaking App <hello@caretakingapp.com>>
RESEND_REPLY_TO=<optional reply-to email>
```

Deploy with Vercel's normal Git flow or CLI:

```bash
vercel
vercel --prod
```

After the first production deploy, update `NEXT_PUBLIC_SITE_URL` and Supabase Auth URLs if the final production domain differs from the temporary Vercel URL.

## Reminder Job

The reminder job route is:

```text
/api/jobs/process-reminders
```

It supports both `GET` and `POST`.

For Vercel Cron, create a cron job for:

```text
GET https://your-app.vercel.app/api/jobs/process-reminders
```

This repo includes `vercel.json` with the same cron path on a daily schedule so it deploys on Vercel Hobby. For immediate reminder smoke testing, use the manual trigger below. On a Pro plan, you can change the cron schedule to run more frequently.

Set `CRON_SECRET` in Vercel. Vercel sends it automatically as:

```http
Authorization: Bearer <CRON_SECRET>
```

Recommended schedules:

- Hobby Vercel plan: daily cron in `vercel.json`, plus manual triggering for live reminder tests.
- Pro or higher Vercel plan: change `vercel.json` to a more frequent schedule for live reminder testing.

Manual smoke-test trigger:

```bash
curl -X POST https://your-app.vercel.app/api/jobs/process-reminders \
  -H "x-cron-secret: <CRON_SECRET>"
```

The job is designed to be idempotent: due reminders are locked with `FOR UPDATE SKIP LOCKED`, moved from `scheduled` to `sent`, and protected by a unique reminder-recipient notification index.

## Smoke Test

Run the full smoke test in:

```text
docs/smoke-test.md
```

Minimum live test acceptance flow:

1. Sign in as User A with a magic link.
2. Create a generic shared space.
3. Invite User B by email.
4. Sign in as User B and accept the invite.
5. As User A, log a generic event.
6. Confirm User B sees the timeline update and an unread notification.
7. Create a one-time reminder due now or within the next minute.
8. Trigger the reminder job.
9. Confirm a reminder notification appears once.
10. Mark the notification as read.

## Deployment Safety Notes

- Core write paths use transactional database RPCs.
- Direct app writes are intentionally limited to self-profile bootstrap and notification preferences.
- Invite raw tokens are sent by email only and are not stored in invite delivery metadata.
- Logged-action and reminder-completion emails are recipient-controlled per care space and deduped through notification delivery records.
- Final RLS is applied by migrations, not by manual SQL from `supabase/policies`.
- The reminder route uses the service role only inside the server route and requires a cron secret.
