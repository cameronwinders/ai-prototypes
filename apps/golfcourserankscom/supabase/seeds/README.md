# Course Catalog Seed

Import source: `supabase/seeds/course-catalog.csv`

## Expected Columns

- `seed_rank`
- `name`
- `city`
- `state`
- `par`
- `slope`
- `rating`
- `price_band`
- `source_lists`
- `seed_tier`
- `source_notes`

## Run

```bash
npm run seed:courses --workspace=golfcourserankscom
```

Required env:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_DB_SCHEMA=app_golfcourserankscom_`

The seed script transforms the source columns into `seed_source` JSON, computes `seed_score` from `seed_rank`, upserts the course catalog, and refreshes `course_aggregates`.
