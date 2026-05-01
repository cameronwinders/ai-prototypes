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

const COURSE_ALIASES = {
  "Pacific Dunes": {
    "golfweek-you-can-play": ["Bandon Dunes Golf Resort (Pacific Dunes)"]
  },
  "Pebble Beach Golf Links": {
    "golf-top-100": ["Pebble Beach"],
    "golfweek-you-can-play": ["Pebble Beach Resorts (Pebble Beach Golf Links)"]
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
  "Bandon Dunes": {
    "golfweek-you-can-play": ["Bandon Dunes Golf Resort (Bandon Dunes)"]
  },
  "Bandon Trails": {
    "golfweek-you-can-play": ["Bandon Dunes Golf Resort (Bandon Trails)"]
  },
  "Old Macdonald": {
    "golfweek-you-can-play": ["Bandon Dunes Golf Resort (Old Macdonald)"]
  },
  "Sheep Ranch": {
    "golfweek-you-can-play": ["Bandon Dunes Golf Resort (Sheep Ranch)"]
  },
  "Kiawah Island Ocean Course": {
    "golf-top-100": ["Kiawah Island (Ocean)"],
    "golfweek-you-can-play": ["Kiawah Island Golf Resort (Ocean)"],
    "golf-digest-public": ["Kiawah Island Golf Resort: The Ocean Course"]
  },
  "TPC Sawgrass Stadium Course": {
    "golf-top-100": ["TPC Sawgrass (Players Stadium)"],
    "golfweek-you-can-play": ["TPC Sawgrass (Players Stadium)"],
    "golf-digest-public": ["TPC Sawgrass: Stadium"]
  },
  "The Lido at Sand Valley": {
    "golf-top-100": ["Sand Valley (The Lido)"],
    "golfweek-you-can-play": ["Sand Valley (Lido)"],
    "golf-digest-public": ["Sand Valley: The Lido"]
  },
  "Gamble Sands Brewster Course": {
    "golf-top-100": ["Gamble Sands"],
    "golfweek-you-can-play": ["Gamble Sands"]
  },
  "Manele Golf Course": {
    "golf-top-100": ["Four Seasons Lanai (Manele)"],
    "golfweek-you-can-play": ["Four Seasons Resort Lanai (Manele)"]
  },
  "Shadow Creek Public Access": {
    "golf-top-100": ["Shadow Creek"],
    "golfweek-you-can-play": ["Shadow Creek"],
    "golf-digest-public": ["Shadow Creek"]
  },
  "Sand Valley Golf Resort": {
    "golf-top-100": ["Sand Valley (Sand Valley)"],
    "golfweek-you-can-play": ["Sand Valley (Sand Valley)"],
    "golf-digest-public": ["Sand Valley Golf Resort: Sand Valley"]
  },
  "Mammoth Dunes": {
    "golf-top-100": ["Sand Valley (Mammoth Dunes)"],
    "golfweek-you-can-play": ["Sand Valley (Mammoth Dunes)"],
    "golf-digest-public": ["Sand Valley Golf Resort: Mammoth Dunes"]
  },
  "Whistling Straits": {
    "golfweek-you-can-play": ["Kohler Whistling Straits (Straits)"],
    "golf-digest-public": ["Whistling Straits: Straits Course"]
  },
  "Spyglass Hill Golf Course": {
    "golfweek-you-can-play": ["Pebble Beach Resorts (Spyglass Hill)"]
  },
  "Harbour Town Golf Links": {
    "golf-top-100": ["Harbour Town"],
    "golfweek-you-can-play": ["Sea Pines Resort (Harbour Town Golf Links)"]
  },
  "Streamsong Red": {
    "golfweek-you-can-play": ["Streamsong (Red)"],
    "golf-digest-public": ["Streamsong Resort: Red"]
  },
  "Streamsong Blue": {
    "golfweek-you-can-play": ["Streamsong (Blue)"],
    "golf-digest-public": ["Streamsong Resort: Blue"]
  },
  "French Lick Resort Pete Dye Course": {
    "golf-top-100": ["French Lick (Pete Dye)"],
    "golf-digest-public": ["French Lick Resort: Pete Dye Course"]
  },
  "The Dunes Course at Prairie Club": {
    "golf-top-100": ["Prairie Club (Dunes)"],
    "golfweek-you-can-play": ["Prairie Club (Dunes)"],
    "golf-digest-public": ["The Prairie Club (Dunes Course)"]
  },
  "The Pines Course at Prairie Club": {
    "golf-digest-public": ["The Prairie Club: Pines Course"]
  },
  "The Field Club at Frisco Fields Ranch West": {
    "golf-digest-public": ["Fields Ranch PGA of America Frisco: West Course"]
  },
  "Arcadia Bluffs Bluffs Course": {
    "golf-digest-public": ["Arcadia Bluffs Golf Club (Bluffs)"]
  },
  "Red Sky Norman Course": {
    "golf-digest-public": ["Red Sky Ranch & Golf Club Norman Course"],
    "golfweek-you-can-play": ["Red Sky Ranch & Golf Club Norman Course"]
  },
  "Red Sky Fazio Course": {
    "golf-digest-public": ["Red Sky Ranch & Golf Club Fazio Course"],
    "golfweek-you-can-play": ["Red Sky Ranch & Golf Club Fazio Course"]
  },
  "Paynes Valley Golf Course": {
    "golf-digest-public": ["Big Cedar Lodge: Payne's Valley"]
  },
  "The Links Quarry at Bay Harbor": {
    "golf-digest-public": ["Bay Harbor Golf Club: Links/Quarry"]
  },
  "Sand Hollow Championship Course": {
    "golf-top-100": ["Sand Hollow"],
    "golfweek-you-can-play": ["Sand Hollow"]
  },
  "Omni Homestead Cascades Course": {
    "golf-top-100": ["Omni Homestead (Cascades)"],
    "golfweek-you-can-play": ["Omni Homestead Resort (Cascades)"],
    "golf-digest-public": ["The Omni Homestead Resort: Cascades Course"]
  },
  "Sea Island Seaside Course": {
    "golf-top-100": ["Sea Island (Seaside)"],
    "golfweek-you-can-play": ["Sea Island (Seaside)"],
    "golf-digest-public": ["Sea Island: Seaside"]
  },
  "Hanalei Golf Course": {
    "golfweek-you-can-play": ["Princeville (Makai)"]
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
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildNameCandidates(name) {
  const variants = new Set([
    normalizeName(name),
    normalizeName(name.replace(/:/g, " ")),
    normalizeName(name.replace(/\(.*?\)/g, " ")),
    normalizeName(name.replace(/\b(golf|course|club|resort|lodge|state park|country club)\b/gi, " "))
  ]);

  return Array.from(variants).filter(Boolean);
}

function rowMatchesCandidate(rowName, candidate) {
  return buildNameCandidates(rowName).includes(candidate);
}

function findRankForCourse(courseName, sourceKey, sourceRows) {
  const aliases = COURSE_ALIASES[courseName]?.[sourceKey] ?? [];
  const preferredCandidates = [...aliases, courseName].flatMap(buildNameCandidates);

  for (const candidate of preferredCandidates) {
    const exactRow = sourceRows.find((row) => rowMatchesCandidate(row.name, candidate));
    if (exactRow) {
      return exactRow.rank;
    }
  }

  return null;
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
    rank: row.position,
    name: row.data.name
  }));
}

function parseGolfweekRows(html) {
  return [...html.matchAll(/<h2 class=gnt_ar_b_mt>([^<]+)<\/h2>/g)].map((match) => {
    const text = match[1].replace(/&amp;/g, "&").replace(/\u00a0/g, " ").replace(/\*+$/g, "").trim();
    const rankMatch = text.match(/^T?(\d+)\.\s*(.+)$/);
    return {
      rank: Number(rankMatch[1]),
      name: rankMatch[2].trim()
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
  await page.waitForTimeout(3000);

  const rows = (await page.locator("h5").allTextContents())
    .map((text) => text.replace(/\s+/g, " ").trim())
    .filter((text) => /^\d+\.\s/.test(text))
    .map((text) => {
      const match = text.match(/^(\d+)\.\s*(.+)$/);
      return {
        rank: Number(match[1]),
        name: match[2].trim()
      };
    });

  await browser.close();
  return rows;
}

function applyEditorialRanks(rows, sourceRowsByKey) {
  const [header, ...dataRows] = rows;
  const nextHeader = header.includes("golf_digest_rank")
    ? header
    : `${header},golf_digest_rank,golf_com_rank,golfweek_rank`;

  const nextRows = dataRows.map((line) => {
    const columns = parseCsvLine(line);
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
      sourceNotes
    ] = columns;

    const matchedRanks = {
      "golf-digest-public": findRankForCourse(name, "golf-digest-public", sourceRowsByKey["golf-digest-public"]),
      "golf-top-100": findRankForCourse(name, "golf-top-100", sourceRowsByKey["golf-top-100"]),
      "golfweek-you-can-play": findRankForCourse(name, "golfweek-you-can-play", sourceRowsByKey["golfweek-you-can-play"])
    };
    const refreshedSourceLists = Object.entries(EDITORIAL_CONFIG)
      .filter(([sourceKey]) => matchedRanks[sourceKey])
      .map(([, config]) => config.label);

    return [
      seedRank,
      name,
      city,
      state,
      par,
      slope,
      rating,
      priceBand,
      refreshedSourceLists.length > 0 ? refreshedSourceLists.join("|") : sourceLists,
      seedTier,
      sourceNotes,
      matchedRanks["golf-digest-public"] ?? "",
      matchedRanks["golf-top-100"] ?? "",
      matchedRanks["golfweek-you-can-play"] ?? ""
    ]
      .map(csvEscape)
      .join(",");
  });

  return [nextHeader, ...nextRows].join("\n");
}

const csvLines = readFileSync(csvPath, "utf8").trim().split(/\r?\n/);
const golfComHtml = await fetchHtml(GOLF_COM_URL);
const golfweekHtml = await fetchHtml(GOLFWEEK_URL);
const [golfComRows, golfweekRows, golfDigestRows] = await Promise.all([
  parseGolfComRows(golfComHtml),
  parseGolfweekRows(golfweekHtml),
  parseGolfDigestRows()
]);

writeFileSync(
  csvPath,
  applyEditorialRanks(csvLines, {
    "golf-top-100": golfComRows,
    "golfweek-you-can-play": golfweekRows,
    "golf-digest-public": golfDigestRows
  }),
  "utf8"
);

console.log(
  `Updated editorial rank columns in ${csvPath} from Golf Digest, GOLF.com, and Golfweek source lists.`
);
