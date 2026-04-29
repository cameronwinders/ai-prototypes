# Course Catalog Seed

Import source: `supabase/seeds/course-catalog.csv`

Run `npm run seed:courses --workspace=golfcourseranks-com` after setting:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_DB_SCHEMA`

The seed script converts the source columns into the `seed_source` JSON stored on `courses`.
