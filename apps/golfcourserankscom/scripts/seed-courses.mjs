import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const csvPath = join(root, "supabase", "seeds", "course-catalog.csv");
const csv = readFileSync(csvPath, "utf8").trim();
const lines = csv.split(/\r?\n/);
const [, ...rows] = lines;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const schema = process.env.APP_DB_SCHEMA ?? "app_golfcourserankscom_";

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema
  }
});

function buildCourseIdentity(record) {
  return `${record.name}::${record.city}::${record.state}`.toLowerCase();
}

function parseCsvLine(line) {
  return line
    .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
    .map((value) => value.replace(/^"|"$/g, "").replace(/""/g, '"').trim());
}

function parseNullableInteger(value) {
  return value ? Number(value) : null;
}

function parseNullableFloat(value) {
  return value ? Number(value) : null;
}

const records = rows.map((row) => {
  const [
    seedRank,
    name,
    city,
    state,
    par,
    slope,
    rating,
    priceBand,
    sourceLists,
    seedTier,
    sourceNotes,
    golfDigestRank,
    golfComRank,
    golfweekRank
  ] = parseCsvLine(row);

  const numericSeedRank = Number(seedRank);
  const seedScore = Number((2600 - numericSeedRank * 6).toFixed(2));

  return {
    name,
    city,
    state,
    par: parseNullableInteger(par),
    slope: parseNullableInteger(slope),
    rating: parseNullableFloat(rating),
    price_band: parseNullableInteger(priceBand),
    seed_rank: numericSeedRank,
    seed_score: seedScore,
    seed_source: {
      lists: sourceLists.split("|").map((value) => value.trim()).filter(Boolean),
      editorial_ranks: {
        ...(golfDigestRank ? { "golf-digest-public": Number(golfDigestRank) } : {}),
        ...(golfComRank ? { "golf-top-100": Number(golfComRank) } : {}),
        ...(golfweekRank ? { "golfweek-you-can-play": Number(golfweekRank) } : {})
      },
      seed_tier: seedTier,
      notes: sourceNotes
    }
  };
});

const { error } = await supabase.from("courses").upsert(records, {
  onConflict: "name,city,state"
});

if (error) {
  console.error(error);
  process.exit(1);
}

const refresh = await supabase.rpc("refresh_course_aggregates");

if (refresh.error) {
  console.error(refresh.error);
  process.exit(1);
}

const { data: existingCourses, error: existingCoursesError } = await supabase
  .from("courses")
  .select("id,name,city,state");

if (existingCoursesError) {
  console.error(existingCoursesError);
  process.exit(1);
}

const validIdentities = new Set(records.map(buildCourseIdentity));
const staleCourses = existingCourses.filter((course) => !validIdentities.has(buildCourseIdentity(course)));

if (staleCourses.length > 0) {
  const { data: playedRefs, error: playedRefsError } = await supabase
    .from("played_courses")
    .select("course_id")
    .in(
      "course_id",
      staleCourses.map((course) => course.id)
    );

  if (playedRefsError) {
    console.error(playedRefsError);
    process.exit(1);
  }

  const referencedCourseIds = new Set(playedRefs.map((row) => row.course_id));
  const removableCourses = staleCourses.filter((course) => !referencedCourseIds.has(course.id));

  if (removableCourses.length > 0) {
    const { error: deleteError } = await supabase
      .from("courses")
      .delete()
      .in(
        "id",
        removableCourses.map((course) => course.id)
      );

    if (deleteError) {
      console.error(deleteError);
      process.exit(1);
    }
  }
}

console.log(`Seeded ${records.length} courses from ${csvPath}.`);
