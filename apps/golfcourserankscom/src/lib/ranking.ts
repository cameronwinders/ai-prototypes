import type {
  CompareCourse,
  CourseAggregateRecord,
  CourseAiSummary,
  CourseRecord,
  HandicapBand,
  LeaderboardCourse,
  PlayedCourse,
  RankedCourse
} from "@/lib/types";

const AI_DISCLAIMER =
  "AI-generated from crowd ranking signals and optional golfer notes. Treat this as directional, especially while the sample is still early.";

const LOVE_THEMES = [
  {
    label: "conditioning",
    words: ["firm", "conditioning", "pure", "greens", "fast", "manicured", "maintained", "condition"]
  },
  {
    label: "scenery",
    words: ["views", "view", "ocean", "mountain", "cliffs", "scenic", "beautiful", "lake"]
  },
  {
    label: "routing",
    words: ["routing", "layout", "holes", "varied", "walkable", "memorable", "design", "architecture"]
  },
  {
    label: "value",
    words: ["value", "worth", "fair", "reasonable", "public", "affordable"]
  },
  {
    label: "challenge",
    words: ["challenge", "test", "demanding", "strategic", "risk", "reward"]
  }
] as const;

const COMPLAINT_THEMES = [
  {
    label: "price",
    words: ["expensive", "overpriced", "pricey", "fee", "cost", "value"]
  },
  {
    label: "pace",
    words: ["slow", "pace", "backed", "waiting", "crowded", "packed"]
  },
  {
    label: "punishing",
    words: ["hard", "punishing", "brutal", "unfair", "lost", "penal", "rough"]
  },
  {
    label: "wind",
    words: ["wind", "gust", "weather"]
  },
  {
    label: "service",
    words: ["service", "staff", "cart", "starter", "marshal"]
  }
] as const;

export function formatLocation(course: Pick<CourseRecord, "city" | "state">) {
  return `${course.city}, ${course.state}`;
}

export function slugifyCourseName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getPriceBandLabel(value: number | null) {
  if (!value) {
    return "Flexible pricing";
  }

  const labels = {
    1: "Value public",
    2: "Solid trip value",
    3: "Destination day",
    4: "Premium public",
    5: "Bucket-list fee"
  } as const;

  return labels[value as keyof typeof labels] ?? "Premium public";
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatUpdatedAt(iso: string | null) {
  if (!iso) {
    return "Not saved yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(iso));
}

export function computeCourseScore(
  seedScore: number,
  wins: number,
  losses: number,
  numSignals: number,
  numUniqueGolfers: number
) {
  const crowdDelta = (wins - losses) * 10 + Math.log2(numSignals + 1) * 18 + numUniqueGolfers * 3;
  const weight = Math.min(numUniqueGolfers / 10, 1);
  return Number((seedScore * (1 - weight) + (seedScore + crowdDelta) * weight).toFixed(2));
}

export function normalizeLeaderboard<T extends { score: number }>(courses: T[]) {
  const scores = courses.map((course) => course.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);

  return courses.map((course) => ({
    ...course,
    normalizedScore: max === min ? 100 : Number((((course.score - min) / (max - min)) * 100).toFixed(1))
  }));
}

export function toLeaderboardCourse(
  course: CourseRecord,
  aggregate: CourseAggregateRecord | null,
  fallback: Partial<LeaderboardCourse> = {}
): LeaderboardCourse {
  return {
    ...course,
    leaderboardRank: aggregate?.rank ?? fallback.leaderboardRank ?? course.seed_rank,
    normalizedScore: aggregate?.normalized_score ?? fallback.normalizedScore ?? 0,
    score: aggregate?.score ?? fallback.score ?? course.seed_score,
    crowdScore: aggregate?.crowd_score ?? fallback.crowdScore ?? 0,
    numSignals: aggregate?.num_signals ?? fallback.numSignals ?? 0,
    numUniqueGolfers: aggregate?.num_unique_golfers ?? fallback.numUniqueGolfers ?? 0,
    wins: aggregate?.wins ?? fallback.wins ?? 0,
    losses: aggregate?.losses ?? fallback.losses ?? 0,
    isEarly: aggregate?.is_early ?? fallback.isEarly ?? true
  };
}

function topTheme(
  notes: string[],
  themes: ReadonlyArray<{ label: string; words: readonly string[] }>
) {
  const lower = notes.map((note) => note.toLowerCase());
  const scored = themes
    .map((theme) => ({
      label: theme.label,
      score: lower.reduce((count, note) => {
        return count + theme.words.reduce((hits, word) => hits + (note.includes(word) ? 1 : 0), 0);
      }, 0)
    }))
    .filter((theme) => theme.score > 0)
    .sort((left, right) => right.score - left.score);

  return scored[0]?.label ?? null;
}

export function buildAiCourseStory(
  course: CourseRecord,
  aggregate: CourseAggregateRecord | null,
  noteSamples: string[],
  viewerBand: HandicapBand | null
): CourseAiSummary {
  const numSignals = aggregate?.num_signals ?? 0;
  const numGolfers = aggregate?.num_unique_golfers ?? 0;
  const hasEnoughData = numSignals >= 6 || noteSamples.length >= 3;

  if (!hasEnoughData) {
    return {
      loves: ["Not enough signals yet. As more golfers rank this course and leave notes, the summary will sharpen."],
      complaints: ["We intentionally hold back confident takeaways until the crowd sample is more trustworthy."],
      disclaimer: AI_DISCLAIMER,
      fit: null,
      hasEnoughData: false
    };
  }

  const loves: string[] = [];
  const complaints: string[] = [];
  const loveTheme = topTheme(noteSamples, LOVE_THEMES);
  const complaintTheme = topTheme(noteSamples, COMPLAINT_THEMES);

  if (loveTheme === "conditioning") {
    loves.push("Golfers most often praise how polished the surfaces feel, especially the greens and overall conditioning.");
  } else if (loveTheme === "scenery") {
    loves.push("The scenery shows up often in golfer notes, which usually means the round feels memorable beyond the scorecard.");
  } else if (loveTheme === "routing") {
    loves.push("Golfers keep calling out the routing and hole variety, a good sign that the course stays interesting from start to finish.");
  } else if (loveTheme === "value") {
    loves.push("The value angle comes through in golfer notes, suggesting people feel good about what they get for the trip or greens fee.");
  } else if (loveTheme === "challenge") {
    loves.push("Golfers describe this as a test worth taking, with enough strategic bite to make strong rounds feel earned.");
  } else if ((course.slope ?? 0) >= 136) {
    loves.push("The higher slope and stronger crowd score point to a course golfers respect as a serious test.");
  } else {
    loves.push("Golfers tend to keep this course high in the stack because it balances fun, memorability, and repeat-play appeal.");
  }

  if ((aggregate?.normalized_score ?? 0) >= 75) {
    loves.push("Its current crowd position suggests it is already landing as a national favorite rather than a merely solid public option.");
  } else if ((aggregate?.normalized_score ?? 0) >= 55) {
    loves.push("The ranking profile reads as above-average and dependable, with enough support to feel earned.");
  }

  if ((course.price_band ?? 0) <= 2) {
    loves.push("For a public-course trip planner, the price tier helps this feel attainable enough to recommend widely.");
  }

  if (complaintTheme === "price") {
    complaints.push("Price comes up in the critical notes, so some golfers may love the course more than they love the bill.");
  } else if (complaintTheme === "pace") {
    complaints.push("Pace of play shows up in the complaints, which can drag on the day even when the architecture is strong.");
  } else if (complaintTheme === "punishing") {
    complaints.push("A chunk of the negative feedback centers on how penal it can feel when ball-striking is even slightly off.");
  } else if (complaintTheme === "wind") {
    complaints.push("Wind and weather variance show up as the biggest friction points, so the experience may swing hard by day.");
  } else if (complaintTheme === "service") {
    complaints.push("Some of the rough edges seem operational rather than architectural, with service details surfacing in complaints.");
  } else if ((course.price_band ?? 0) >= 4) {
    complaints.push("The premium fee tier means value-minded golfers may need more than scenery alone to justify a repeat visit.");
  } else if ((course.slope ?? 0) >= 138) {
    complaints.push("The sharper difficulty profile can make it feel more exacting than relaxing for mid- and high-handicap rounds.");
  } else {
    complaints.push("The course still looks a bit early in the sample, so the exact national slot could move as more golfers weigh in.");
  }

  if (numGolfers < 5) {
    complaints.push("The sample is still small enough that a few new rankings could move the course more than a mature leaderboard entry.");
  }

  let fit: string | null = null;
  if (viewerBand === "0-5") {
    fit =
      (course.slope ?? 0) >= 133
        ? "For a 0–5 handicap, this profile should feel like a satisfying exam rather than a gentle tune-up."
        : "For a 0–5 handicap, this reads more like a polished fun round than an all-day survival test.";
  } else if (viewerBand === "6-10" || viewerBand === "11-18") {
    fit =
      (course.slope ?? 0) >= 136
        ? "For a mid-handicap golfer, the challenge level looks meaningful but still playable if you like a firmer edge."
        : "For a mid-handicap golfer, the setup should feel approachable enough to enjoy while still surfacing the best holes.";
  } else if (viewerBand === "19+") {
    fit =
      (course.slope ?? 0) >= 134
        ? "For a 19+ handicap, this may be better as a special-trip challenge than a comfort-round favorite."
        : "For a 19+ handicap, the profile looks friendlier and more likely to let the setting shine without constant damage control.";
  }

  return {
    loves: loves.slice(0, 3),
    complaints: complaints.slice(0, 3),
    disclaimer: AI_DISCLAIMER,
    fit,
    hasEnoughData: true
  };
}

export function compareRankings(selfCourses: RankedCourse[], friendCourses: RankedCourse[]) {
  const friendMap = new Map(friendCourses.map((course) => [course.id, course]));
  const overlap = selfCourses
    .filter((course) => friendMap.has(course.id))
    .map<CompareCourse>((course) => {
      const friendCourse = friendMap.get(course.id)!;
      return {
        id: course.id,
        name: course.name,
        city: course.city,
        state: course.state,
        selfRank: course.rankPosition + 1,
        friendRank: friendCourse.rankPosition + 1,
        delta: friendCourse.rankPosition - course.rankPosition
      };
    })
    .sort((left, right) => {
      if (Math.abs(left.delta) !== Math.abs(right.delta)) {
        return Math.abs(left.delta) - Math.abs(right.delta);
      }

      return left.selfRank - right.selfRank;
    });

  return {
    overlap,
    selfOnlyCount: selfCourses.filter((course) => !friendMap.has(course.id)).length,
    friendOnlyCount: friendCourses.filter((course) => !selfCourses.some((own) => own.id === course.id)).length
  };
}

export function splitPlayedCourses(courses: PlayedCourse[]) {
  return {
    ranked: courses
      .filter((course) => course.rankPosition !== null)
      .sort((left, right) => (left.rankPosition ?? 0) - (right.rankPosition ?? 0)) as RankedCourse[],
    unranked: courses
      .filter((course) => course.rankPosition === null)
      .sort((left, right) => new Date(right.playedAt).getTime() - new Date(left.playedAt).getTime())
  };
}
