import type {
  CourseRatingRecord,
  CourseRecord,
  HandicapBand,
  LeaderboardCourse,
  RankedCourse
} from "@/lib/types";

export function formatLocation(course: Pick<CourseRecord, "city" | "state">) {
  return `${course.city}, ${course.state}`;
}

export function getPriceBandLabel(value: number | null) {
  if (!value) {
    return "Flexible pricing";
  }

  const labels = {
    1: "Budget-friendly",
    2: "Accessible splurge",
    3: "Destination day rate",
    4: "Premium public",
    5: "Bucket-list green fee"
  } as const;

  return labels[value as keyof typeof labels] ?? "Premium public";
}

export function buildAiCourseStory(
  course: CourseRecord,
  rating: CourseRatingRecord | null,
  viewerBand: HandicapBand | null = null
) {
  if (!rating || rating.num_signals === 0) {
    return null;
  }

  const loves: string[] = [];
  const complaints: string[] = [];

  if (rating.normalized_score >= 75) {
    loves.push("Golfers consistently place it near the top of their personal lists, so it is landing as a true national favorite.");
  } else if (rating.normalized_score >= 55) {
    loves.push("Players tend to rate it above average thanks to a reliable mix of fun routing and replay value.");
  } else {
    loves.push("Even when it is not a top-tier darling, golfers still keep it in the conversation for a memorable round.");
  }

  if ((course.slope ?? 0) >= 138) {
    loves.push("The higher slope hints at a sharper edge, which usually appeals to golfers who want a more exacting test.");
    complaints.push("Misses get magnified here, so some golfers will call out how punishing it feels on an off-strike day.");
  } else if ((course.slope ?? 0) >= 128) {
    loves.push("It asks enough questions to feel serious without turning every hole into survival mode.");
  } else {
    loves.push("Its gentler slope profile suggests a round that more handicaps can enjoy right away.");
  }

  if ((course.price_band ?? 0) >= 4) {
    complaints.push("The green fee likely reads as a commitment, so value-minded golfers may hesitate before making it a repeat play.");
  } else {
    loves.push("The price band suggests golfers can feel good about the value side of the experience.");
  }

  if (rating.num_unique_golfers < 4) {
    complaints.push("The sample is still early, so the exact leaderboard slot can move fast as more golfers add rankings.");
  } else if (rating.losses > rating.wins) {
    complaints.push("In head-to-head ranking signals, it loses a few more battles than it wins, which points to a course people like more than they truly love.");
  } else {
    loves.push("Its win-loss signal is healthy enough to support the current ranking rather than feeling like a fluke.");
  }

  let fit: string | null = null;
  if (viewerBand) {
    if (viewerBand === "0-5") {
      fit = (course.slope ?? 0) >= 133
        ? "For low-handicap golfers, the sharper slope suggests enough bite to keep the round interesting."
        : "For low-handicap golfers, this looks more like a polished fun round than a punishing exam.";
    } else if (viewerBand === "19+") {
      fit = (course.slope ?? 0) >= 133
        ? "For a 19+ handicap, this may be better as a special-day challenge than a stress-free comfort pick."
        : "For a 19+ handicap, the friendlier slope profile should make it easier to enjoy the architecture without getting beat up.";
    } else {
      fit = "For mid-range handicaps, this profile reads like a course that can still reward solid ball-striking without demanding perfection all day.";
    }
  }

  return {
    loves: loves.slice(0, 3),
    complaints: complaints.slice(0, 3),
    fit
  };
}

export function compareRankings(selfCourses: RankedCourse[], otherCourses: RankedCourse[]) {
  const selfMap = new Map(selfCourses.map((course) => [course.id, course]));
  const otherMap = new Map(otherCourses.map((course) => [course.id, course]));
  const overlap = selfCourses
    .filter((course) => otherMap.has(course.id))
    .map((course) => {
      const other = otherMap.get(course.id)!;
      return {
        id: course.id,
        name: course.name,
        selfRank: course.rankIndex + 1,
        otherRank: other.rankIndex + 1,
        delta: other.rankIndex - course.rankIndex,
        city: course.city,
        state: course.state
      };
    })
    .sort((left, right) => Math.abs(left.delta) - Math.abs(right.delta));

  return {
    overlap,
    selfOnly: selfCourses.filter((course) => !otherMap.has(course.id)).slice(0, 5),
    otherOnly: otherCourses.filter((course) => !selfMap.has(course.id)).slice(0, 5)
  };
}

export function toLeaderboardCard(
  course: CourseRecord,
  rating: CourseRatingRecord | null
): LeaderboardCourse {
  return {
    ...course,
    leaderboardRank: rating?.rank ?? null,
    normalizedScore: rating?.normalized_score ?? 0,
    numSignals: rating?.num_signals ?? 0,
    numUniqueGolfers: rating?.num_unique_golfers ?? 0,
    wins: rating?.wins ?? 0,
    losses: rating?.losses ?? 0
  };
}
