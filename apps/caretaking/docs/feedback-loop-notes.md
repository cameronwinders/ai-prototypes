# Caretaking Feedback Loop Notes

## 2026-04-29 Round 12 triage

Source: `C:\Users\cwind\OneDrive\Documents\Cam Cowork\Caregiving App\Feedback\latest.md`

Highest-priority product pain points from the report:

- Bugs affecting trust:
  - Auth emails still use Supabase default confirm and magic-link templates.
  - Notification emails and the in-app notification panel appear to show UTC-based times for users whose profile timezone is still `UTC`.
  - Expired magic links land on a clean sign-in form with no recovery guidance.
- UX issues affecting speed and repeated use:
  - Event type selection in the redesigned log-event form is visually ambiguous.
  - Timeline events are still write-only because cards are not clickable.
  - Invite flow remains a dead end when the viewer is not an owner.

What Codex fixed from this round:

- Added client-side sign-in hash parsing so expired email links show a clear inline error and reset the form state for retry.
- Strengthened the event-type selection state in the log-event form with muted inactive icons and an explicit selected indicator.

What Codex intentionally did not change in this pass:

- Supabase-hosted email templates and link-domain branding, because they still live outside the repo.
- Timestamp rendering in notification emails, because the code already formats using the recipient profile timezone; the remaining issue appeared to come from user profiles defaulting to `UTC` and needed a broader timezone strategy rather than a formatter-only patch.
- Event detail pages and invite permissions, because those require a larger workflow change than this safe triage pass.

Follow-up shipped after triage:

- Added browser timezone capture plus a profile-editable timezone field, so new users stop inheriting `UTC` and older profiles can recover to a real local zone.
