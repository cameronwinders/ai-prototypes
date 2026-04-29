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
const schema = process.env.APP_DB_SCHEMA ?? "app_golfcourseranks_com_";

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

const records = rows.map((row) => {
  const [
    name,
    city,
    state,
    par,
    slope,
    rating,
    priceBand,
    sourceName,
    sourceTier,
    sourceNotes
  ] = row.split(",");

  return {
    name,
    city,
    state,
    par: Number(par),
    slope: Number(slope),
    rating: Number(rating),
    price_band: Number(priceBand),
    seed_source: {
      list: sourceName,
      tier: sourceTier,
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

console.log(`Seeded ${records.length} courses from ${csvPath}.`);
