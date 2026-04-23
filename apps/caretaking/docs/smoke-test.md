# Core Flow Smoke Test

Run this after applying migrations to a local or staging Supabase project and deploying the Next.js app.

## Preflight

1. Run `npm run verify:config`.
2. Run `npm run typecheck`.
3. Run `npm run build`.
4. Confirm the app has all required environment variables from `.env.example`.
5. Confirm the Supabase project has email OTP enabled for Auth.
6. Confirm `CRON_SECRET` is set in the app runtime. `APP_CRON_SECRET` is supported only as a fallback.

## Manual Core Flow

1. Sign in as User A with the magic-link flow.
2. Create a shared space with a generic primary subject.
3. From the timeline, invite User B as `Caregiver`.
4. Confirm User B receives the invite email and the raw invite token is not logged in app output or database delivery metadata.
5. Sign in as User B and accept the invite.
6. As User A, log a generic event from the quick-log form.
7. Confirm User B sees an unread in-app notification.
8. As User A or User B, create a one-time reminder due within the next minute.
9. Trigger `POST /api/jobs/process-reminders` with header `x-cron-secret: <CRON_SECRET>`, or trigger `GET /api/jobs/process-reminders` with `Authorization: Bearer <CRON_SECRET>`.
10. Confirm exactly one reminder notification appears for each intended recipient.
11. Mark the notification as read and confirm the unread count decreases.

## RLS Spot Checks

1. User B should not see spaces they do not belong to.
2. A `Viewer` invitee should be able to view timeline data but should be rejected by `create_event_mvp` and `create_reminder_mvp`.
3. A non-owner should not be able to create invites.
4. A user should not be able to read another user's notifications.
5. A user should not be able to select `space_invites.token_hash`.
