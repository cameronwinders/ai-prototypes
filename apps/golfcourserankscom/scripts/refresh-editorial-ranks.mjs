import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const root = process.cwd();
const csvPath = join(root, "supabase", "seeds", "course-catalog.csv");
const require = createRequire(import.meta.url);

const GOLF_COM_URL =
  "https://golf.com/travel/courses/best-public-golf-courses-america-2024-25/";
const GOLFWEEK_URL =
  "https://golfweek.usatoday.com/story/sports/golf/2025/06/30/golfweeks-best-2025-public-access-top-100-golf-courses-united-states-best-you-can-play/83866517007/";
const GOLF_DIGEST_URL =
  "https://www.golfdigest.com/story/americas-100-greatest-public-golf-courses-ranking";

const CSV_HEADER = [
  "seed_rank",
  "name",
  "city",
  "state",
  "par",
  "slope",
  "rating",
  "price_band",
  "source_lists",
  "seed_tier",
  "source_notes",
  "golf_digest_rank",
  "golf_com_rank",
  "golfweek_rank"
].join(",");

const EDITORIAL_CONFIG = {
  "golf-digest-public": {
    label: "Golf Digest Public",
    column: "golf_digest_rank"
  },
  "golf-top-100": {
    label: "GOLF Top 100",
    column: "golf_com_rank"
  },
  "golfweek-you-can-play": {
    label: "Golfweek You Can Play",
    column: "golfweek_rank"
  }
};

const STOPWORDS = new Set([
  "golf",
  "course",
  "club",
  "resort",
  "links",
  "country",
  "state",
  "park",
  "hotel",
  "the",
  "at",
  "and"
]);

const COURSE_ALIASES = {
  "Pebble Beach Golf Links": {
    "golf-top-100": ["Pebble Beach"],
    "golfweek-you-can-play": ["Pebble Beach Resorts (Pebble Beach Golf Links)"]
  },
  "Pacific Dunes": {
    "golfweek-you-can-play": ["Bandon Dunes Golf Resort (Pacific Dunes)"]
  },
  "Pinehurst No 2": {
    "golf-top-100": ["Pinehurst No. 2"],
    "golfweek-you-can-play": ["Pinehurst (No. 2)"],
    "golf-digest-public": ["Pinehurst #2"]
  },
  "Bethpage Black": {
    "golf-top-100": ["Bethpage (Black)"],
    "golfweek-you-can-play": ["Bethpage State Park (Black)"],
    "golf-digest-public": ["Bethpage State Park: Black"]
  },
  "Whistling Straits": {
    "golfweek-you-can-play": ["Kohler Whistling Straits (Straits)"],
    "golf-digest-public": ["Whistling Straits: Straits Course"]
  },
  "Blackwolf Run River Course": {
    "golf-digest-public": ["Blackwolf Run: River"]
  },
  "Bandon Trails": {
    "golfweek-you-can-play": ["Bandon Dunes Golf Resort (Bandon Trails)"]
  },
  "Old Macdonald": {
    "golfweek-you-can-play": ["Bandon Dunes Golf Resort (Old Macdonald)"]
  },
  "Bandon Dunes": {
    "golfweek-you-can-play": ["Bandon Dunes Golf Resort (Bandon Dunes)"]
  },
  "Sheep Ranch": {
    "golfweek-you-can-play": ["Bandon Dunes Golf Resort (Sheep Ranch)"],
    "golf-digest-public": ["Bandon Dunes Golf Resort: Sheep Ranch"]
  },
  "Spyglass Hill Golf Course": {
    "golfweek-you-can-play": ["Pebble Beach Resorts (Spyglass Hill)"]
  },
  "TPC Sawgrass Stadium Course": {
    "golf-top-100": ["TPC Sawgrass (Players Stadium)"],
    "golfweek-you-can-play": ["TPC Sawgrass (Players Stadium)"],
    "golf-digest-public": ["TPC Sawgrass: Stadium"]
  },
  "Harbour Town Golf Links": {
    "golf-top-100": ["Harbour Town"],
    "golfweek-you-can-play": ["Sea Pines Resort (Harbour Town Golf Links)"]
  },
  "Shadow Creek Public Access": {
    "golf-top-100": ["Shadow Creek"],
    "golfweek-you-can-play": ["Shadow Creek"],
    "golf-digest-public": ["Shadow Creek"]
  },
  "The Dunes Course at Prairie Club": {
    "golf-top-100": ["Prairie Club (Dunes)"],
    "golfweek-you-can-play": ["Prairie Club (Dunes)"],
    "golf-digest-public": ["The Prairie Club (Dunes Course)"]
  },
  "The Pines Course at Prairie Club": {
    "golf-digest-public": ["The Prairie Club: Pines Course"],
    "golfweek-you-can-play": ["Prairie Club (Pines)"]
  },
  "Omni Homestead Cascades Course": {
    "golf-top-100": ["Omni Homestead (Cascades)"],
    "golfweek-you-can-play": ["Omni Homestead Resort (Cascades)"],
    "golf-digest-public": ["The Omni Homestead Resort: Cascades Course"]
  },
  "The Park West Palm": {
    "golf-top-100": ["The Park"],
    "golfweek-you-can-play": ["The Park West Palm"],
    "golf-digest-public": ["The Park at West Palm Beach"]
  },
  "The Park": {
    "golf-digest-public": ["The Park at West Palm Beach"],
    "golfweek-you-can-play": ["The Park at West Palm Beach"]
  },
  "Southern Pines Golf Club": {
    "golf-top-100": ["Southern Pines"],
    "golf-digest-public": ["Southern Pines Golf Club"]
  },
  "Pine Needles Lodge and Golf Club": {
    "golf-top-100": ["Pine Needles"],
    "golfweek-you-can-play": ["Pine Needles"]
  },
  "Sea Island Seaside Course": {
    "golf-top-100": ["Sea Island (Seaside)"],
    "golfweek-you-can-play": ["Sea Island (Seaside)"],
    "golf-digest-public": ["Sea Island: Seaside"]
  },
  "French Lick Resort Pete Dye Course": {
    "golf-top-100": ["French Lick (Dye Course)", "French Lick (Pete Dye)"],
    "golf-digest-public": ["French Lick Resort: Pete Dye Course"]
  },
  "French Lick Resort Ross Course": {
    "golf-top-100": ["French Lick (Ross Course)"],
    "golfweek-you-can-play": ["French Lick Resort (Donald Ross Course)"]
  },
  "Wild Horse Golf Club": {
    "golf-top-100": ["Wild Horse"],
    "golfweek-you-can-play": ["Wild Horse"],
    "golf-digest-public": ["Wild Horse Golf Club"]
  },
  "Manele Golf Course": {
    "golf-top-100": ["Four Seasons Lanai (Manele)"],
    "golfweek-you-can-play": ["Four Seasons Resort Lanai (Manele)"]
  },
  "American Dunes Golf Club": {
    "golf-top-100": ["American Dunes"]
  },
  "The Greenbrier Old White Course": {
    "golf-top-100": ["The Greenbrier (Old White)"],
    "golfweek-you-can-play": ["The Greenbrier (Old White)"],
    "golf-digest-public": ["The Greenbrier: Old White"]
  },
  "Firestone South Course": {
    "golf-top-100": ["Firestone (South)"],
    "golfweek-you-can-play": ["Firestone (South)"],
    "golf-digest-public": ["Firestone Country Club: South"]
  },
  "Sand Hollow Championship Course": {
    "golf-top-100": ["Sand Hollow"],
    "golfweek-you-can-play": ["Sand Hollow"]
  },
  "Ozarks National Golf Course": {
    "golf-top-100": ["Ozarks National"],
    "golf-digest-public": ["Big Cedar Lodge: Ozarks National"]
  },
  "PGA West Stadium Course": {
    "golf-top-100": ["PGA West (Pete Dye Stadium)"]
  },
  "Palmetto Bluff May River Course": {
    "golf-top-100": ["Palmetto Bluff (May River)"]
  },
  "Silvies Valley Ranch Craddock Course": {
    "golf-top-100": ["Silvies Valley Ranch (Craddock/Hankins)"]
  },
  "The Dunes Golf and Beach Club": {
    "golf-top-100": ["The Dunes"],
    "golfweek-you-can-play": ["The Dunes Golf & Beach Club"],
    "golf-digest-public": ["The Dunes Golf & Beach Club"]
  },
  "Cape Arundel Golf Club": {
    "golf-top-100": ["Cape Arundel"]
  },
  "Bethpage Red": {
    "golf-top-100": ["Bethpage (Red)"]
  },
  "Wilderness Club": {
    "golf-top-100": ["Wilderness Club"],
    "golf-digest-public": ["Wilderness Club"]
  },
  "Innisbrook Copperhead Course": {
    "golf-top-100": ["Innisbrook Resort (Copperhead)"]
  },
  "George Wright Golf Course": {
    "golf-top-100": ["George Wright"]
  },
  "Bay Hill Club and Lodge": {
    "golf-top-100": ["Bay Hill"],
    "golfweek-you-can-play": ["Bay Hill Club and Lodge"]
  },
  "Taconic Golf Club": {
    "golf-top-100": ["Taconic"],
    "golf-digest-public": ["Taconic Golf Club"]
  },
  "Karsten Creek Golf Club": {
    "golf-top-100": ["Karsten Creek"],
    "golfweek-you-can-play": ["Karsten Creek"]
  },
  "Mossy Oak Golf Club": {
    "golf-top-100": ["Mossy Oak"],
    "golfweek-you-can-play": ["Mossy Oak"],
    "golf-digest-public": ["Mossy Oak Golf Club"]
  },
  "Caledonia Golf and Fish Club": {
    "golf-top-100": ["Caledonia"],
    "golfweek-you-can-play": ["Caledonia Golf & Fish Club"]
  },
  "Trump National Doral Blue Monster": {
    "golf-top-100": ["Trump National Doral (Blue Monster)"],
    "golf-digest-public": ["Trump National Doral: Blue Monster"]
  },
  "Black Mesa Golf Club": {
    "golf-top-100": ["Black Mesa"],
    "golf-digest-public": ["Black Mesa Golf Club"]
  },
  "Paynes Valley Golf Course": {
    "golf-top-100": ["Payne's Valley"],
    "golf-digest-public": ["Big Cedar Lodge: Payne's Valley"]
  },
  "Pinehurst No 8": {
    "golf-top-100": ["Pinehurst No. 8"]
  },
  "CordeValle Golf Club": {
    "golf-top-100": ["CordeValle"],
    "golfweek-you-can-play": ["CordeValle"],
    "golf-digest-public": ["CordeValle Golf Club"]
  },
  "Warren Golf Course at Notre Dame": {
    "golf-top-100": ["Warren Course (Notre Dame)"]
  },
  "Primland Highland Course": {
    "golf-top-100": ["Primland"],
    "golfweek-you-can-play": ["Primland (Highland)"],
    "golf-digest-public": ["The Highland Course At Primland"]
  },
  "Omni La Costa North Course": {
    "golf-top-100": ["Omni La Costa Resort and Spa (North)"]
  },
  "Pfau Course at Indiana University": {
    "golf-top-100": ["Pfau Course at Indiana University"],
    "golf-digest-public": ["The Pfau Course At Indiana University"]
  },
  "Paako Ridge Golf Club": {
    "golf-top-100": ["Paako Ridge"],
    "golfweek-you-can-play": ["PaaKo Ridge"],
    "golf-digest-public": ["Paako Ridge Golf Club"]
  },
  "Stoatin Brae Golf Club": {
    "golf-top-100": ["Stoatin Brae"]
  },
  "Keswick Hall Full Cry": {
    "golf-top-100": ["Keswick Hall (Full Cry)"],
    "golfweek-you-can-play": ["Keswick Hall and GC (Full Cry)"]
  },
  "Reynolds Lake Oconee Great Waters": {
    "golf-digest-public": ["Reynolds Lake Oconee: Great Waters"]
  },
  "Wine Valley Golf Club": {
    "golf-digest-public": ["Wine Valley Golf Club"]
  },
  "Buffalo Ridge Springs Golf Course": {
    "golf-digest-public": ["Big Cedar Lodge: Buffalo Ridge"],
    "golfweek-you-can-play": ["Big Cedar Lodge (Buffalo Ridge)"]
  },
  "Blackwolf Run Meadow Valleys": {
    "golf-digest-public": ["Blackwolf Run: Meadow Valleys"],
    "golfweek-you-can-play": ["Blackwolf Run (Meadow Valleys)"]
  },
  "Madden's Classic at Maddens": {
    "golf-digest-public": ["Madden's on Gull Lake: The Classic at Madden's"]
  },
  "The Field Club at Frisco Fields Ranch West": {
    "golf-digest-public": ["Fields Ranch PGA of America Frisco: West Course"]
  },
  "Cog Hill Dubsdread": {
    "golf-digest-public": ["Cog Hill Golf & Country Club: Dubsdread (Course #4)"]
  },
  "Hanalei Golf Course": {
    "golfweek-you-can-play": ["Princeville (Makai)"],
    "golf-digest-public": ["Makai Golf Club"]
  },
  "Tullymore Golf Resort": {
    "golf-digest-public": ["Tullymore Golf Resort"]
  },
  "Crosswater Club Public Access": {
    "golf-digest-public": ["Crosswater Golf Course"],
    "golfweek-you-can-play": ["Sunriver Resort (Crosswater)"]
  },
  "Wynn Golf Club": {
    "golf-digest-public": ["Wynn Golf Club"]
  },
  "Lawsonia Links": {
    "golf-digest-public": ["The Golf Courses of Lawsonia: Links"]
  },
  "Mystic Rock at Nemacolin": {
    "golf-digest-public": ["Nemacolin: Mystic Rock"]
  },
  "Tetherow Golf Club": {
    "golf-digest-public": ["Tetherow Golf Club"]
  },
  "Mauna Kea Golf Course": {
    "golf-digest-public": ["Mauna Kea Beach Hotel Golf Course"]
  },
  "Pronghorn Nicklaus Course": {
    "golf-digest-public": ["Pronghorn Club at Juniper Preserve"]
  },
  "PGA Frisco East": {
    "golf-digest-public": ["PGA Frisco: Fields Ranch East"]
  },
  "Arcadia Bluffs Bluffs Course": {
    "golf-digest-public": ["Arcadia Bluffs Golf Club (Bluffs)"]
  },
  "Mammoth Dunes": {
    "golf-digest-public": ["Sand Valley Golf Resort: Mammoth Dunes"],
    "golfweek-you-can-play": ["Sand Valley (Mammoth Dunes)"]
  },
  "The Links Quarry at Bay Harbor": {
    "golf-digest-public": ["Bay Harbor Golf Club: Links/Quarry"]
  },
  "Sand Valley Golf Resort": {
    "golf-digest-public": ["Sand Valley Golf Resort: Sand Valley"],
    "golf-top-100": ["Sand Valley (Sand Valley)"],
    "golfweek-you-can-play": ["Sand Valley (Sand Valley)"]
  },
  "Sedge Valley at Sand Valley": {
    "golf-digest-public": ["Sand Valley Golf Resort: Sedge Valley"],
    "golf-top-100": ["Sand Valley (Sedge Valley)"],
    "golfweek-you-can-play": ["Sand Valley (Sedge Valley)"]
  },
  "The Lido at Sand Valley": {
    "golf-top-100": ["Sand Valley (The Lido)"],
    "golfweek-you-can-play": ["Sand Valley (Lido)"],
    "golf-digest-public": ["Sand Valley: The Lido"]
  },
  "Forest Dunes The Loop": {
    "golf-top-100": ["Forest Dunes (Loop)"],
    "golfweek-you-can-play": ["Forest Dunes (The Loop Red & Black)"]
  },
  "Mid Pines Inn and Golf Club": {
    "golf-top-100": ["Mid Pines"],
    "golfweek-you-can-play": ["Mid Pines"]
  },
  "Black Desert Resort": {
    "golf-top-100": ["Black Desert Resort Golf Course"]
  }
};

const COURSE_METADATA_OVERRIDES = {
  "Blackwolf Run: River": {
    name: "Blackwolf Run River Course"
  },
  "Sand Valley: The Lido": {
    name: "The Lido at Sand Valley"
  },
  "Harbour Town Golf Links": {
    par: "71",
    slope: "146",
    rating: "75.5",
    price_band: "5"
  },
  Landmand: {
    par: "73",
    slope: "135",
    rating: "74.7",
    price_band: "5"
  },
  "Sweetens Cove": {
    par: "36",
    slope: "123",
    rating: "37.5",
    price_band: "3"
  },
  "Mid Pines Inn and Golf Club": {
    city: "Southern Pines",
    par: "72",
    slope: "136",
    rating: "73.8",
    price_band: "4"
  },
  "Yale Golf Course": {
    par: "70",
    slope: "135",
    rating: "72.9",
    price_band: "4"
  },
  "Sea Island: Seaside": {
    name: "Sea Island Seaside Course",
    city: "St. Simons Island",
    par: "70",
    slope: "141",
    rating: "73.8",
    price_band: "5"
  },
  "The Omni Homestead Resort: Cascades Course": {
    name: "Omni Homestead Cascades Course",
    par: "71",
    slope: "137",
    rating: "73.0",
    price_band: "5"
  },
  "Mid Pines": {
    name: "Mid Pines Inn and Golf Club"
  },
  "The Park": {
    name: "The Park at West Palm Beach",
    par: "72",
    slope: "139",
    rating: "74.2",
    price_band: "3"
  },
  "The Highland Course At Primland": {
    name: "Primland Highland Course",
    par: "72",
    slope: "150",
    rating: "75.1",
    price_band: "5"
  },
  "American Dunes": {
    name: "American Dunes Golf Club",
    par: "72",
    slope: "134",
    rating: "73.4",
    price_band: "4"
  },
  "Mossy Oak Golf Club": {
    par: "72",
    slope: "135",
    rating: "74.5",
    price_band: "4"
  },
  "Black Mesa Golf Club": {
    par: "72",
    slope: "141",
    rating: "73.9",
    price_band: "4"
  },
  "Paako Ridge Golf Club": {
    par: "72",
    slope: "145",
    rating: "76.0",
    price_band: "4"
  },
  "The Links At Spanish Bay": {
    name: "The Links at Spanish Bay",
    par: "72",
    slope: "143",
    rating: "73.8",
    price_band: "5"
  },
  "The Dunes": {
    name: "The Dunes Golf and Beach Club",
    city: "Myrtle Beach",
    par: "72",
    slope: "148",
    rating: "76.1",
    price_band: "4"
  },
  "Firestone Country Club: South": {
    name: "Firestone South Course",
    par: "70",
    slope: "132",
    rating: "76.1",
    price_band: "5"
  },
  "Karsten Creek": {
    name: "Karsten Creek Golf Club",
    par: "72",
    slope: "142",
    rating: "76.1",
    price_band: "5"
  },
  "Ozarks National": {
    name: "Ozarks National Golf Course",
    par: "71",
    slope: "131",
    rating: "73.9",
    price_band: "5"
  },
  "Bay Hill Club and Lodge": {
    city: "Orlando",
    state: "FL",
    par: "72",
    slope: "138",
    rating: "75.2",
    price_band: "5"
  },
  "Tetherow Golf Club": {
    par: "72",
    slope: "141",
    rating: "75.4",
    price_band: "4"
  },
  "Black Desert Resort Golf Course": {
    name: "Black Desert Resort"
  }
};

function parseCsvLine(line) {
  return line
    .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
    .map((value) => value.replace(/^"|"$/g, "").replace(/""/g, '"').trim());
}

function csvEscape(value) {
  if (value == null) {
    return "";
  }

  const stringValue = String(value);
  if (!/[",\n]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replace(/"/g, '""')}"`;
}

function normalizeName(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\bno\.?\s*/g, " number ")
    .replace(/#/g, " number ")
    .replace(/\bsaint\b/g, "st")
    .replace(/\((.*?)\)/g, " $1 ")
    .replace(/:/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildNameCandidates(name) {
  const variants = new Set([
    normalizeName(name),
    normalizeName(name.replace(/\(.*?\)/g, " ")),
    normalizeName(name.replace(/\b(golf|course|club|resort|lodge|state park|country club|hotel)\b/gi, " "))
  ]);

  return Array.from(variants).filter(Boolean);
}

function tokenize(value) {
  return normalizeName(value)
    .split(" ")
    .filter((token) => token && !STOPWORDS.has(token));
}

function parseLocationString(value) {
  const match = value?.trim().match(/^(.*?),\s*([A-Z]{2})$/);
  if (!match) {
    return {
      city: "",
      state: ""
    };
  }

  return {
    city: match[1].trim(),
    state: match[2].trim().toUpperCase()
  };
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function overlapScore(left, right) {
  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);
  if (leftTokens.length === 0 || rightTokens.length === 0) {
    return 0;
  }

  const leftSet = new Set(leftTokens);
  const rightSet = new Set(rightTokens);
  let overlap = 0;
  for (const token of leftSet) {
    if (rightSet.has(token)) {
      overlap += 1;
    }
  }

  return overlap / Math.max(leftSet.size, rightSet.size);
}

function sourceRankKeys(record) {
  return ["golf_digest_rank", "golf_com_rank", "golfweek_rank"].filter((key) => Number(record[key]) > 0);
}

function displayNameForNewRow(sourceName) {
  return sourceName
    .replace(/\s+/g, " ")
    .replace(/\bNo\.\s*(\d+)/gi, "No $1")
    .replace(/\s+&\s+/g, " & ")
    .trim();
}

function applyCourseOverride(record) {
  const override = COURSE_METADATA_OVERRIDES[record.name];
  if (!override) {
    return;
  }

  if (override.name) {
    record.name = override.name;
  }
  if (override.city) {
    record.city = override.city;
  }
  if (override.state) {
    record.state = override.state;
  }
  if (override.par) {
    record.par = override.par;
  }
  if (override.slope) {
    record.slope = override.slope;
  }
  if (override.rating) {
    record.rating = override.rating;
  }
  if (override.price_band) {
    record.price_band = override.price_band;
  }
}

function mergeDuplicateRecords(recordRows) {
  const byIdentity = new Map();
  const merged = [];

  for (const row of recordRows) {
    applyCourseOverride(row);
    const identity = `${row.name}::${row.city}::${row.state}`.toLowerCase();
    const existing = byIdentity.get(identity);

    if (!existing) {
      byIdentity.set(identity, row);
      merged.push(row);
      continue;
    }

    for (const key of ["par", "slope", "rating", "price_band", "golf_digest_rank", "golf_com_rank", "golfweek_rank"]) {
      if (!existing[key] && row[key]) {
        existing[key] = row[key];
      }
    }

    if ((!existing.source_notes || existing.source_notes === "Added from refreshed editorial source coverage") && row.source_notes) {
      existing.source_notes = row.source_notes;
    }

    if (existing.seed_tier === "Tier C" && row.seed_tier && row.seed_tier !== "Tier C") {
      existing.seed_tier = row.seed_tier;
    }
  }

  recordRows.splice(0, recordRows.length, ...merged);
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

function parseGolfComRows(html) {
  const start = html.indexOf('data-rows="');
  const end = html.indexOf(']">', start) + 1;

  if (start === -1 || end === 0) {
    throw new Error("Could not locate GOLF.com data rows.");
  }

  const raw = html.slice(start + 'data-rows="'.length, end);
  const decoded = raw
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

  return JSON.parse(decoded).map((row) => ({
    rank: Number(row.position),
    name: row.data.name.trim(),
    city: row.data.city?.trim() ?? "",
    state: row.data.state_code?.trim().toUpperCase() ?? ""
  }));
}

function parseGolfweekRows(html) {
  const blocks = [...html.matchAll(/<h2 class=gnt_ar_b_mt>([^<]+)<\/h2>([\s\S]*?)(?=<h2 class=gnt_ar_b_mt>|$)/g)];
  return blocks.map((match) => {
    const heading = match[1].replace(/&amp;/g, "&").replace(/\u00a0/g, " ").replace(/\*+$/g, "").trim();
    const rankMatch = heading.match(/^T?(\d+)\.\s*(.+)$/);
    const locationMatch = match[2].match(/<strong>Location:<\/strong>\s*([^<]+)/i);
    const location = parseLocationString((locationMatch?.[1] ?? "").replace(/&amp;/g, "&").trim());

    return {
      rank: Number(rankMatch[1]),
      name: rankMatch[2].trim(),
      city: location.city,
      state: location.state
    };
  });
}

async function parseGolfDigestRows() {
  const { chromium } = require("playwright");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(GOLF_DIGEST_URL, {
    waitUntil: "networkidle",
    timeout: 120_000
  });
  await page.waitForTimeout(3_000);

  const rows = await page.locator("h5").evaluateAll((nodes) =>
    nodes
      .map((node) => ({
        heading: node.textContent?.replace(/\s+/g, " ").trim() ?? "",
        block: node.parentElement?.innerText ?? ""
      }))
      .filter((item) => /^\d+\.\s/.test(item.heading))
      .map((item) => {
        const headingMatch = item.heading.match(/^(\d+)\.\s*(.+)$/);
        const lines = item.block
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        const rankIndex = lines.findIndex((line) => /^\d+\.\s/.test(line));
        const locationLine = rankIndex >= 0 ? lines[rankIndex + 1] ?? "" : "";
        return {
          rank: Number(headingMatch?.[1]),
          name: headingMatch?.[2]?.trim() ?? "",
          locationLine
        };
      })
  );

  await browser.close();

  return rows.map((row) => {
    const location = parseLocationString(row.locationLine);
    return {
      rank: row.rank,
      name: row.name,
      city: location.city,
      state: location.state
    };
  });
}

function parseExistingRows(csvLines) {
  return csvLines.slice(1).map((line) => {
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
    ] = parseCsvLine(line);

    return {
      seed_rank: Number(seedRank),
      name,
      city,
      state,
      par,
      slope,
      rating,
      price_band: priceBand,
      source_lists: sourceLists,
      seed_tier: seedTier,
      source_notes: sourceNotes,
      golf_digest_rank: golfDigestRank,
      golf_com_rank: golfComRank,
      golfweek_rank: golfweekRank
    };
  });
}

function isAvailableForSource(row, sourceColumn, assignedRows) {
  if (assignedRows.has(row)) {
    return false;
  }

  return !row[sourceColumn];
}

function findExistingMatch(recordRows, sourceKey, sourceColumn, sourceRow, assignedRows) {
  const normalizedSourceName = normalizeName(sourceRow.name);
  const sourceCandidates = buildNameCandidates(sourceRow.name);
  const targetByAlias = recordRows.find((row) =>
    isAvailableForSource(row, sourceColumn, assignedRows) &&
    (COURSE_ALIASES[row.name]?.[sourceKey] ?? []).some((alias) => normalizeName(alias) === normalizedSourceName)
  );

  if (targetByAlias) {
    return targetByAlias;
  }

  const exact = recordRows.find(
    (row) =>
      isAvailableForSource(row, sourceColumn, assignedRows) &&
      buildNameCandidates(row.name).some((candidate) => sourceCandidates.includes(candidate))
  );
  if (exact) {
    return exact;
  }

  if (sourceRow.city && sourceRow.state) {
    const sameLocation = recordRows.filter(
      (row) =>
        isAvailableForSource(row, sourceColumn, assignedRows) &&
        row.city.toLowerCase() === sourceRow.city.toLowerCase() &&
        row.state.toUpperCase() === sourceRow.state.toUpperCase()
    );

    let best = null;
    let bestScore = 0;
    for (const row of sameLocation) {
      const score = overlapScore(row.name, sourceRow.name);
      if (score > bestScore) {
        best = row;
        bestScore = score;
      }
    }

    if (best && bestScore >= 0.34) {
      return best;
    }
  }

  const sameState = sourceRow.state
    ? recordRows.filter(
        (row) => isAvailableForSource(row, sourceColumn, assignedRows) && row.state.toUpperCase() === sourceRow.state.toUpperCase()
      )
    : [];
  let best = null;
  let bestScore = 0;
  for (const row of sameState) {
    const score = overlapScore(row.name, sourceRow.name);
    if (score > bestScore) {
      best = row;
      bestScore = score;
    }
  }

  if (best && bestScore >= 0.72) {
    return best;
  }

  return null;
}

function ensureCourseRecord(recordRows, sourceKey, sourceColumn, sourceRow, assignedRows) {
  const match = findExistingMatch(recordRows, sourceKey, sourceColumn, sourceRow, assignedRows);
  if (match) {
    applyCourseOverride(match);
    assignedRows.add(match);
    return match;
  }

  const created = {
    seed_rank: 9999,
    name: displayNameForNewRow(sourceRow.name),
    city: sourceRow.city || "Unknown City",
    state: sourceRow.state || "NA",
    par: "",
    slope: "",
    rating: "",
    price_band: "",
    source_lists: "",
    seed_tier: "Tier C",
    source_notes: "Added from refreshed editorial source coverage",
    golf_digest_rank: "",
    golf_com_rank: "",
    golfweek_rank: ""
  };

  recordRows.push(created);
  applyCourseOverride(created);
  assignedRows.add(created);
  return created;
}

function recomputeSeedOrder(recordRows) {
  for (const row of recordRows) {
    const sourceRanks = sourceRankKeys(row);
    const averageRank =
      sourceRanks.length > 0
        ? average(sourceRanks.map((key) => Number(row[key])))
        : Number.MAX_SAFE_INTEGER;
    const sourceLabels = [];
    if (row.golf_digest_rank) {
      sourceLabels.push(EDITORIAL_CONFIG["golf-digest-public"].label);
    }
    if (row.golf_com_rank) {
      sourceLabels.push(EDITORIAL_CONFIG["golf-top-100"].label);
    }
    if (row.golfweek_rank) {
      sourceLabels.push(EDITORIAL_CONFIG["golfweek-you-can-play"].label);
    }

    row.source_lists = sourceLabels.join("|");
    row._average_rank = averageRank;
    row._source_count = sourceRanks.length;
    row._best_rank = sourceRanks.length > 0 ? Math.min(...sourceRanks.map((key) => Number(row[key]))) : Number.MAX_SAFE_INTEGER;
  }

  recordRows.sort((left, right) => {
    if (left._average_rank !== right._average_rank) {
      return left._average_rank - right._average_rank;
    }

    if (right._source_count !== left._source_count) {
      return right._source_count - left._source_count;
    }

    if (left._best_rank !== right._best_rank) {
      return left._best_rank - right._best_rank;
    }

    return left.name.localeCompare(right.name);
  });

  recordRows.forEach((row, index) => {
    row.seed_rank = index + 1;
    delete row._average_rank;
    delete row._source_count;
    delete row._best_rank;
  });
}

function serializeRows(recordRows) {
  return [
    CSV_HEADER,
    ...recordRows.map((row) =>
      [
        row.seed_rank,
        row.name,
        row.city,
        row.state,
        row.par,
        row.slope,
        row.rating,
        row.price_band,
        row.source_lists,
        row.seed_tier,
        row.source_notes,
        row.golf_digest_rank,
        row.golf_com_rank,
        row.golfweek_rank
      ]
        .map(csvEscape)
        .join(",")
    )
  ].join("\n");
}

const csvLines = readFileSync(csvPath, "utf8").trim().split(/\r?\n/);
const records = parseExistingRows(csvLines);
mergeDuplicateRecords(records);
const golfComHtml = await fetchHtml(GOLF_COM_URL);
const golfweekHtml = await fetchHtml(GOLFWEEK_URL);
const [golfComRows, golfweekRows, golfDigestRows] = await Promise.all([
  Promise.resolve(parseGolfComRows(golfComHtml)),
  Promise.resolve(parseGolfweekRows(golfweekHtml)),
  parseGolfDigestRows()
]);

for (const record of records) {
  record.golf_digest_rank = "";
  record.golf_com_rank = "";
  record.golfweek_rank = "";
}

const digestAssigned = new Set();
for (const row of golfDigestRows) {
  const record = ensureCourseRecord(records, "golf-digest-public", "golf_digest_rank", row, digestAssigned);
  record.golf_digest_rank = String(row.rank);
}

const golfAssigned = new Set();
for (const row of golfComRows) {
  const record = ensureCourseRecord(records, "golf-top-100", "golf_com_rank", row, golfAssigned);
  record.golf_com_rank = String(row.rank);
}

const golfweekAssigned = new Set();
for (const row of golfweekRows) {
  const record = ensureCourseRecord(records, "golfweek-you-can-play", "golfweek_rank", row, golfweekAssigned);
  record.golfweek_rank = String(row.rank);
}

mergeDuplicateRecords(records);
recomputeSeedOrder(records);

writeFileSync(csvPath, serializeRows(records), "utf8");

console.log(
  `Expanded ${csvPath} to ${records.length} seeded courses and recomputed seed_rank from the average of Golf Digest, GOLF.com, and Golfweek ranks.`
);
