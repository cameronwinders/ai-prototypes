# PM Brief

Target app: `apps/golfcourserankscom`

## Product Shape

- National-only leaderboard for U.S. public golf courses
- Seeded shortlist of ~200 courses
- Magic-link auth with handicap-band-only onboarding
- Personal played list plus drag-and-drop ranking
- Pairwise comparisons inferred from ranked order
- Social-light compare flow gated by accepted friendship
- Global feedback flow plus admin-only feedback viewer

## Data Model

- `app_golfcourserankscom_users`
- `app_golfcourserankscom_courses`
- `app_golfcourserankscom_played_courses`
- `app_golfcourserankscom_user_course_ranks`
- `app_golfcourserankscom_pairwise_signals`
- `app_golfcourserankscom_course_aggregates`
- `app_golfcourserankscom_friendships`
- `app_golfcourserankscom_feedback`

## Product Decisions Captured in Code

- Cold start uses seeded baseline ordering and always labels early results
- Crowd score is blended against seed score until enough unique golfers/signals exist
- Played and rank data stays private unless friendship is accepted
- Course AI summary falls back to safe low-data copy and always shows a disclaimer
- Feedback is available from every major surface through nav or floating CTA
