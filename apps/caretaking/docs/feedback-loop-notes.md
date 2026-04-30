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

## 2026-04-30 Round 13 triage

Source: `C:\Users\cwind\OneDrive\Documents\Cam Cowork\Caregiving App\Feedback\latest.md`

Highest-priority product pain points from the report:

- Bugs affecting trust:
  - Notification emails still showed UTC-style timestamps for recipients whose stored profile timezone was still effectively the old seed value.
  - The in-app notifications page showed notification row creation time instead of the real reminder due time or event occurrence time.
- UX issues affecting clarity and repeated use:
  - Auth email templates are still Supabase-hosted defaults outside the repo.
  - Timeline event cards remain non-clickable.
  - Invite flow still tells non-owners to ask the owner without identifying that owner.

What Codex fixed from this round:

- Wired notifications to render the meaningful care timestamp for each item: event occurred time, reminder due time, or reminder completed time.
- Made notification timestamp formatting explicit with the viewer's saved timezone instead of relying on ambient server or browser defaults.
- Hardened email notification timezone fallback so stale `UTC` profile rows no longer keep sending UTC-style timestamps when a more useful application timezone can be resolved.

What Codex intentionally did not change in this pass:

- Supabase Auth email templates and link-domain branding, because they still live outside the repo.
- Event detail routes and owner-label invite UX, because they are larger workflow changes than this safe heartbeat pass.
