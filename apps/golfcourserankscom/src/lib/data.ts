import "server-only";

import type { User } from "@supabase/supabase-js";

import {
  buildAiCourseStory,
  buildRankSignal,
  compareRankings,
  computeCourseScore,
  getEditorialConsensusRank,
  matchesRankSignalFilter,
  slugifyCourseName,
  normalizeLeaderboard,
  toLeaderboardCourse
} from "@/lib/ranking";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSupabaseEnv } from "@/lib/supabase/env";
import type {
  AnalyticsEventName,
  CompareOverview,
  CourseAggregateRecord,
  CourseDetail,
  CourseRecord,
  DiscoverableProfile,
  EmailNotificationType,
  FeedbackRecord,
  FriendCard,
  FriendPresence,
  FriendshipRecord,
  FriendsPageData,
  EditorialKey,
  HandicapBand,
  LeaderboardCourse,
  PendingFriendRequest,
  PlayedCourse,
  PlayedCourseRecord,
  ProfileVisibility,
  PublicProfileOverview,
  RankSignalRecord,
  RankSignalFilter,
  RankedCourse,
  UnrankedReminderCandidate,
  UserProfile,
  WishlistCourse,
  WishlistCourseRecord
} from "@/lib/types";

type LeaderboardSort =
  | "rank"
  | "score"
  | "most-played"
  | "most-compared"
  | "editorial-average"
  | "crowd-vs-editorial"
  | "golf-digest-public"
  | "golf-top-100"
  | "golfweek-you-can-play";

type CourseActivityFilter = "all" | "played" | "not-played";

function ensureConfigured() {
  const env = getServerSupabaseEnv();
  return {
    env,
    configured: Boolean(env.hasPublicAuth && env.hasServiceRole)
  };
}

function sanitizeHandle(value: string) {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28);

  return cleaned.length >= 2 ? cleaned : "golfer";
}

function sanitizeStateCode(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim().toUpperCase();
  return trimmed.length === 2 ? trimmed : null;
}

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isMissingWishlistTableError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) {
    return false;
  }

  return (
    error.code === "42P01" ||
    error.message?.includes("wishlist_courses") ||
    error.message?.includes("does not exist") ||
    false
  );
}

function canViewerSeeProfile(
  profile: UserProfile,
  viewerId: string | null,
  friendship: FriendshipRecord | null
): PublicProfileOverview["visibilityState"] {
  if (viewerId && viewerId === profile.id) {
    return "visible";
  }

  if (profile.profile_visibility === "private") {
    return "private";
  }

  if (profile.profile_visibility === "friends_only") {
    return friendship?.status === "accepted" ? "visible" : "friends_only";
  }

  return "visible";
}

function displayNameFromEmail(email: string | null | undefined) {
  if (!email) {
    return "GolfCourseRanks member";
  }

  const raw = email.split("@")[0] ?? "golfer";
  return raw
    .split(/[._-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

type RankRow = {
  user_id: string;
  course_id: string;
  rank_position: number;
};

function getCourseLists(course: CourseRecord) {
  return Array.isArray(course.seed_source?.lists)
    ? course.seed_source?.lists ?? []
    : [];
}

function attachEditorialRanks(courses: CourseRecord[]) {
  return courses.map((course) => ({
    ...course,
    editorialLists: getCourseLists(course),
    editorialRanks: (course.seed_source?.editorial_ranks as Partial<Record<EditorialKey, number>> | undefined) ?? {}
  }));
}

async function getCoursesByIds(courseIds: string[]) {
  if (courseIds.length === 0) {
    return [] as CourseRecord[];
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("courses").select("*").in("id", courseIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CourseRecord[];
}

async function getAggregatesByIds(courseIds: string[]) {
  if (courseIds.length === 0) {
    return [] as CourseAggregateRecord[];
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("course_aggregates").select("*").in("course_id", courseIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CourseAggregateRecord[];
}

function buildPlayedCourses(
  courses: CourseRecord[],
  playedRows: PlayedCourseRecord[],
  rankRows: RankRow[]
) {
  const courseById = new Map(courses.map((course) => [course.id, course]));
  const noteByCourse = new Map(playedRows.map((row) => [row.course_id, row]));
  const rankByCourse = new Map(rankRows.map((row) => [row.course_id, row.rank_position]));

  return playedRows
    .map<PlayedCourse | null>((row) => {
      const course = courseById.get(row.course_id);
      if (!course) {
        return null;
      }

      return {
        ...course,
        note: row.note,
        playedAt: row.played_at,
        rankPosition: rankByCourse.get(row.course_id) ?? null
      };
    })
    .filter(Boolean) as PlayedCourse[];
}

function buildWishlistCourses(courses: CourseRecord[], wishlistRows: WishlistCourseRecord[]) {
  const courseById = new Map(courses.map((course) => [course.id, course]));

  return wishlistRows
    .map<WishlistCourse | null>((row) => {
      const course = courseById.get(row.course_id);
      if (!course) {
        return null;
      }

      return {
        ...course,
        wishlistedAt: row.created_at
      };
    })
    .filter(Boolean) as WishlistCourse[];
}

async function getAcceptedFriendPresenceMap(viewerId: string, courseIds: string[]) {
  if (courseIds.length === 0) {
    return new Map<string, FriendPresence[]>();
  }

  const admin = createAdminClient();
  const { data: friendshipsData, error: friendshipsError } = await admin
    .from("friendships")
    .select("*")
    .eq("status", "accepted")
    .or(`requester_user_id.eq.${viewerId},addressee_user_id.eq.${viewerId}`);

  if (friendshipsError) {
    throw new Error(friendshipsError.message);
  }

  const otherIds = Array.from(
    new Set(
      ((friendshipsData ?? []) as FriendshipRecord[]).map((friendship) =>
        friendship.requester_user_id === viewerId ? friendship.addressee_user_id : friendship.requester_user_id
      )
    )
  );

  if (otherIds.length === 0) {
    return new Map<string, FriendPresence[]>();
  }

  const [{ data: profilesData, error: profilesError }, { data: playedData, error: playedError }] = await Promise.all([
    admin.from("users").select("id, handle, display_name").in("id", otherIds),
    admin.from("played_courses").select("user_id, course_id").in("user_id", otherIds).in("course_id", courseIds)
  ]);

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  if (playedError) {
    throw new Error(playedError.message);
  }

  const profileById = new Map(
    ((profilesData ?? []) as FriendPresence[]).map((profile) => [profile.id, profile])
  );
  const presenceByCourse = new Map<string, FriendPresence[]>();

  for (const row of (playedData ?? []) as Array<{ user_id: string; course_id: string }>) {
    const profile = profileById.get(row.user_id);
    if (!profile) {
      continue;
    }

    const current = presenceByCourse.get(row.course_id) ?? [];
    current.push(profile);
    presenceByCourse.set(row.course_id, current);
  }

  for (const [courseId, profiles] of presenceByCourse) {
    presenceByCourse.set(
      courseId,
      profiles
        .sort((left, right) =>
          (left.display_name ?? left.handle).localeCompare(right.display_name ?? right.handle)
        )
        .slice(0, 4)
    );
  }

  return presenceByCourse;
}

function rankSnapshotFromScores(
  courses: CourseRecord[],
  counters: Map<string, { wins: number; losses: number; numSignals: number; uniqueGolfers: Set<string> }>
) {
  return normalizeLeaderboard(
    courses.map((course) => {
      const stats = counters.get(course.id) ?? {
        wins: 0,
        losses: 0,
        numSignals: 0,
        uniqueGolfers: new Set<string>()
      };
      const numUniqueGolfers = stats.uniqueGolfers.size;
      const score = computeCourseScore(
        course.seed_score,
        stats.wins,
        stats.losses,
        stats.numSignals,
        numUniqueGolfers
      );

      return {
        courseId: course.id,
        score
      };
    })
  )
    .sort((left, right) => right.score - left.score)
    .map((row, index) => ({
      ...row,
      rank: index + 1
    }));
}

async function getRankSignalMap(courses: LeaderboardCourse[]) {
  if (courses.length === 0) {
    return new Map<string, RankSignalRecord | null>();
  }

  const admin = createAdminClient();
  const recentWindowStart = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);
  const priorWindowStart = new Date(Date.now() - 42 * 24 * 60 * 60 * 1000);
  const { data, error } = await admin
    .from("pairwise_signals")
    .select("user_id, winner_course_id, loser_course_id, created_at")
    .gte("created_at", priorWindowStart.toISOString());

  if (error) {
    throw new Error(error.message);
  }

  const leaderboardIds = new Set(courses.map((course) => course.id));
  const recentCounters = new Map<string, { wins: number; losses: number; numSignals: number; uniqueGolfers: Set<string> }>();
  const priorCounters = new Map<string, { wins: number; losses: number; numSignals: number; uniqueGolfers: Set<string> }>();

  for (const course of courses) {
    recentCounters.set(course.id, { wins: 0, losses: 0, numSignals: 0, uniqueGolfers: new Set<string>() });
    priorCounters.set(course.id, { wins: 0, losses: 0, numSignals: 0, uniqueGolfers: new Set<string>() });
  }

  for (const signal of (data ?? []) as Array<{
    user_id: string;
    winner_course_id: string;
    loser_course_id: string;
    created_at: string;
  }>) {
    const createdAt = new Date(signal.created_at).getTime();
    const inRecent = createdAt >= recentWindowStart.getTime();
    const inPrior = createdAt < recentWindowStart.getTime();

    for (const [courseId, direction] of [
      [signal.winner_course_id, "win"] as const,
      [signal.loser_course_id, "loss"] as const
    ]) {
      if (!leaderboardIds.has(courseId)) {
        continue;
      }

      const targetMap = inRecent ? recentCounters : inPrior ? priorCounters : null;
      if (!targetMap) {
        continue;
      }

      const bucket = targetMap.get(courseId);
      if (!bucket) {
        continue;
      }

      if (direction === "win") {
        bucket.wins += 1;
      } else {
        bucket.losses += 1;
      }

      bucket.numSignals += 1;
      bucket.uniqueGolfers.add(signal.user_id);
    }
  }

  const recentRanks = new Map(rankSnapshotFromScores(courses, recentCounters).map((row) => [row.courseId, row.rank]));
  const priorRanks = new Map(rankSnapshotFromScores(courses, priorCounters).map((row) => [row.courseId, row.rank]));

  return new Map(
    courses.map((course) => [
      course.id,
      buildRankSignal({
        crowdRank: course.leaderboardRank,
        normalizedScore: course.normalizedScore,
        numSignals: course.numSignals,
        numUniqueGolfers: course.numUniqueGolfers,
        editorialAverageRank: course.editorialAverageRank,
        editorialGap: course.editorialGap,
        recentRank: recentRanks.get(course.id) ?? null,
        previousRank: priorRanks.get(course.id) ?? null
      })
    ])
  );
}

export async function ensureProfileForUser(user: User) {
  const admin = createAdminClient();
  const { data: existing, error: existingError } = await admin
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<UserProfile>();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    return existing;
  }

  const baseHandle = sanitizeHandle(user.email?.split("@")[0] ?? "golfer");
  let handle = baseHandle;

  for (let index = 1; index <= 25; index += 1) {
    const { data: collision } = await admin
      .from("users")
      .select("id")
      .eq("handle", handle)
      .maybeSingle<{ id: string }>();

    if (!collision || collision.id === user.id) {
      break;
    }

    handle = `${baseHandle}-${index + 1}`;
  }

  const { data, error } = await admin
    .from("users")
    .upsert({
      id: user.id,
      email: user.email ?? null,
      handle,
      display_name: displayNameFromEmail(user.email),
      onboarding_completed: false
    })
    .select("*")
    .single<UserProfile>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getProfileById(userId: string) {
  const { configured } = ensureConfigured();

  if (!configured) {
    return null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("users").select("*").eq("id", userId).maybeSingle<UserProfile>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

export async function getProfileByHandle(handle: string) {
  const { configured } = ensureConfigured();

  if (!configured) {
    return null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("users")
    .select("*")
    .eq("handle", handle)
    .maybeSingle<UserProfile>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

export async function getAllCourses() {
  const { configured } = ensureConfigured();

  if (!configured) {
    return [] as CourseRecord[];
  }

  const admin = createAdminClient();
  const [{ data, error }, { data: aggregateRows, error: aggregateError }] = await Promise.all([
    admin.from("courses").select("*").limit(400),
    admin.from("course_aggregates").select("course_id, rank, normalized_score, num_unique_golfers, num_signals, is_early").limit(400)
  ]);

  if (error) {
    throw new Error(error.message);
  }

  if (aggregateError) {
    throw new Error(aggregateError.message);
  }

  const aggregateByCourse = new Map(
    ((aggregateRows ?? []) as Array<Pick<CourseAggregateRecord, "course_id" | "rank" | "normalized_score" | "num_unique_golfers" | "num_signals" | "is_early">>).map((row) => [
      row.course_id,
      row
    ])
  );

  return attachEditorialRanks(
    ((data ?? []) as CourseRecord[])
    .map((course) => {
      const aggregate = aggregateByCourse.get(course.id);
      return {
        ...course,
        name: course.name === "Whistling Straits Straits Course" ? "Whistling Straits" : course.name,
        leaderboard_rank: aggregate?.rank ?? null,
        normalized_score: aggregate?.normalized_score ?? null,
        num_unique_golfers: aggregate?.num_unique_golfers ?? null,
        num_signals: aggregate?.num_signals ?? null,
        is_early: aggregate?.is_early ?? true
      };
    })
    .sort((left, right) => {
      const leftRank = left.leaderboard_rank ?? Number.MAX_SAFE_INTEGER;
      const rightRank = right.leaderboard_rank ?? Number.MAX_SAFE_INTEGER;

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      return left.seed_rank - right.seed_rank;
    })
  );
}

export async function getPlayedCoursesForUser(userId: string) {
  const { configured } = ensureConfigured();

  if (!configured) {
    return [] as PlayedCourse[];
  }

  const admin = createAdminClient();
  const [{ data: playedRows, error: playedError }, { data: rankRows, error: rankError }] = await Promise.all([
    admin.from("played_courses").select("*").eq("user_id", userId).order("played_at", { ascending: false }),
    admin.from("user_course_ranks").select("*").eq("user_id", userId).order("rank_position", { ascending: true })
  ]);

  if (playedError) {
    throw new Error(playedError.message);
  }

  if (rankError) {
    throw new Error(rankError.message);
  }

  const played = (playedRows ?? []) as PlayedCourseRecord[];
  const ranks = (rankRows ?? []) as RankRow[];
  const courses = await getCoursesByIds(played.map((row) => row.course_id));
  return buildPlayedCourses(courses, played, ranks);
}

export async function getPlayedCourseIdsForUser(userId: string) {
  const played = await getPlayedCoursesForUser(userId);
  return new Set(played.map((course) => course.id));
}

export async function getWishlistCourseIdsForUser(userId: string) {
  const { configured } = ensureConfigured();

  if (!configured) {
    return new Set<string>();
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("wishlist_courses").select("course_id").eq("user_id", userId);

  if (error) {
    if (isMissingWishlistTableError(error)) {
      return new Set<string>();
    }
    throw new Error(error.message);
  }

  return new Set(((data ?? []) as Array<{ course_id: string }>).map((row) => row.course_id));
}

export async function getWishlistCoursesForUser(userId: string) {
  const { configured } = ensureConfigured();

  if (!configured) {
    return [] as WishlistCourse[];
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("wishlist_courses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingWishlistTableError(error)) {
      return [] as WishlistCourse[];
    }
    throw new Error(error.message);
  }

  const wishlistRows = (data ?? []) as WishlistCourseRecord[];
  const courses = await getCoursesByIds(wishlistRows.map((row) => row.course_id));
  return buildWishlistCourses(courses, wishlistRows);
}

export async function getRankedCoursesForUser(userId: string) {
  const played = await getPlayedCoursesForUser(userId);
  return played
    .filter((course): course is RankedCourse => course.rankPosition !== null)
    .sort((left, right) => left.rankPosition - right.rankPosition);
}

async function buildFilteredLeaderboard(handicapBand: HandicapBand, minSignals: number, limit: number) {
  const admin = createAdminClient();
  const [courses, golferRows, signalRows] = await Promise.all([
    getAllCourses(),
    admin.from("users").select("id").eq("handicap_band", handicapBand).eq("onboarding_completed", true),
    admin.from("pairwise_signals").select("user_id, winner_course_id, loser_course_id")
  ]);

  if (golferRows.error) {
    throw new Error(golferRows.error.message);
  }

  if (signalRows.error) {
    throw new Error(signalRows.error.message);
  }

  const allowedUsers = new Set(((golferRows.data ?? []) as { id: string }[]).map((row) => row.id));
  const counters = new Map<
    string,
    { wins: number; losses: number; numSignals: number; uniqueGolfers: Set<string> }
  >();

  for (const course of courses) {
    counters.set(course.id, {
      wins: 0,
      losses: 0,
      numSignals: 0,
      uniqueGolfers: new Set<string>()
    });
  }

  for (const signal of (signalRows.data ?? []) as Array<{
    user_id: string;
    winner_course_id: string;
    loser_course_id: string;
  }>) {
    if (!allowedUsers.has(signal.user_id)) {
      continue;
    }

    const winner = counters.get(signal.winner_course_id);
    const loser = counters.get(signal.loser_course_id);

    if (!winner || !loser) {
      continue;
    }

    winner.wins += 1;
    winner.numSignals += 1;
    winner.uniqueGolfers.add(signal.user_id);

    loser.losses += 1;
    loser.numSignals += 1;
    loser.uniqueGolfers.add(signal.user_id);
  }

  const ranked = courses.map((course) => {
    const stats = counters.get(course.id)!;
    const numUniqueGolfers = stats.uniqueGolfers.size;
    const score = computeCourseScore(
      course.seed_score,
      stats.wins,
      stats.losses,
      stats.numSignals,
      numUniqueGolfers
    );

    return {
      ...course,
      score,
      crowdScore: Number((score - course.seed_score).toFixed(2)),
      editorialConsensusRank: getEditorialConsensusRank(course),
      editorialGap: null,
      numSignals: stats.numSignals,
      numUniqueGolfers,
      wins: stats.wins,
      losses: stats.losses,
      isEarly: stats.numSignals < 6 || numUniqueGolfers < 3
    };
  });

  const filtered = ranked.filter((course) => course.numSignals >= minSignals);
  const normalized = normalizeLeaderboard(
    [...filtered].sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.seed_rank - right.seed_rank;
    })
  ).map((course, index) => ({
    ...course,
    leaderboardRank: index + 1,
    editorialAverageRank: null,
    editorialGap:
      course.editorialConsensusRank === null
        ? null
        : Number((course.editorialConsensusRank - (index + 1)).toFixed(1))
  }));

  return normalized.slice(0, limit);
}

function assignEditorialAverageRanks(courses: LeaderboardCourse[]) {
  const rankedEditorials = [...courses]
    .filter((course) => course.editorialConsensusRank !== null)
    .sort((left, right) => {
      if ((left.editorialConsensusRank ?? Number.MAX_SAFE_INTEGER) !== (right.editorialConsensusRank ?? Number.MAX_SAFE_INTEGER)) {
        return (left.editorialConsensusRank ?? Number.MAX_SAFE_INTEGER) - (right.editorialConsensusRank ?? Number.MAX_SAFE_INTEGER);
      }

      const nameCompare = left.name.localeCompare(right.name);
      if (nameCompare !== 0) {
        return nameCompare;
      }

      const stateCompare = left.state.localeCompare(right.state);
      if (stateCompare !== 0) {
        return stateCompare;
      }

      return left.city.localeCompare(right.city);
    });

  const editorialAverageRankById = new Map(rankedEditorials.map((course, index) => [course.id, index + 1]));

  return courses.map((course) => {
    const editorialAverageRank = editorialAverageRankById.get(course.id) ?? null;
    return {
      ...course,
      editorialAverageRank,
      editorialGap: editorialAverageRank === null ? null : editorialAverageRank - course.leaderboardRank
    };
  });
}

function sortLeaderboardRows(courses: LeaderboardCourse[], sort: LeaderboardSort) {
  const ranked = [...courses];

  ranked.sort((left, right) => {
    if (sort === "score") {
      if (right.normalizedScore !== left.normalizedScore) {
        return right.normalizedScore - left.normalizedScore;
      }
    } else if (sort === "editorial-average") {
      const leftAverageRank = left.editorialAverageRank ?? Number.MAX_SAFE_INTEGER;
      const rightAverageRank = right.editorialAverageRank ?? Number.MAX_SAFE_INTEGER;

      if (leftAverageRank !== rightAverageRank) {
        return leftAverageRank - rightAverageRank;
      }
    } else if (sort === "crowd-vs-editorial") {
      const leftGap = left.editorialGap ?? Number.NEGATIVE_INFINITY;
      const rightGap = right.editorialGap ?? Number.NEGATIVE_INFINITY;

      if (leftGap !== rightGap) {
        return rightGap - leftGap;
      }
    } else if (sort === "most-played") {
      if (right.numUniqueGolfers !== left.numUniqueGolfers) {
        return right.numUniqueGolfers - left.numUniqueGolfers;
      }
    } else if (sort === "most-compared") {
      if (right.numSignals !== left.numSignals) {
        return right.numSignals - left.numSignals;
      }
    } else if (sort !== "rank") {
      const leftEditorialRank = left.editorialRanks?.[sort as EditorialKey] ?? Number.MAX_SAFE_INTEGER;
      const rightEditorialRank = right.editorialRanks?.[sort as EditorialKey] ?? Number.MAX_SAFE_INTEGER;

      if (leftEditorialRank !== rightEditorialRank) {
        return leftEditorialRank - rightEditorialRank;
      }
    } else if (left.leaderboardRank !== right.leaderboardRank) {
      return left.leaderboardRank - right.leaderboardRank;
    }

    if (right.normalizedScore !== left.normalizedScore) {
      return right.normalizedScore - left.normalizedScore;
    }

    const nameCompare = left.name.localeCompare(right.name);
    if (nameCompare !== 0) {
      return nameCompare;
    }

    return left.seed_rank - right.seed_rank;
  });

  return ranked;
}

export async function getLeaderboardCourses(options?: {
  handicapBand?: HandicapBand | null;
  minSignals?: number;
  state?: string | null;
  sort?: LeaderboardSort;
  limit?: number;
  viewerId?: string | null;
  activity?: CourseActivityFilter;
  signal?: RankSignalFilter;
}) {
  const { configured } = ensureConfigured();

  if (!configured) {
    return [] as LeaderboardCourse[];
  }

  const handicapBand = options?.handicapBand ?? null;
  const minSignals = options?.minSignals ?? 0;
  const selectedState = options?.state?.trim().toUpperCase() ?? null;
  const sort = options?.sort ?? "rank";
  const limit = options?.limit ?? 100;
  const viewerId = options?.viewerId ?? null;
  const activity = options?.activity ?? "all";
  const signalFilter = options?.signal ?? "all";

  if (handicapBand) {
    const filteredByBand = await buildFilteredLeaderboard(handicapBand, minSignals, 250);
    let filteredByState = selectedState
      ? filteredByBand.filter((course) => course.state.toUpperCase() === selectedState)
      : filteredByBand;
    const playedIds = viewerId ? await getPlayedCourseIdsForUser(viewerId) : null;

    if (playedIds && activity !== "all") {
      filteredByState = filteredByState.filter((course) =>
        activity === "played" ? playedIds.has(course.id) : !playedIds.has(course.id)
      );
    }

    const preparedRows = assignEditorialAverageRanks(filteredByState);
    const sortedRows = sortLeaderboardRows(preparedRows, sort);
    const [friendPresence, rankSignals] = await Promise.all([
      viewerId
        ? getAcceptedFriendPresenceMap(viewerId, sortedRows.map((course) => course.id))
        : Promise.resolve(new Map<string, FriendPresence[]>()),
      getRankSignalMap(sortedRows)
    ]);

    return sortedRows
      .map((course) => ({
        ...course,
        viewerPlayed: playedIds?.has(course.id) ?? false,
        friendPlayers: friendPresence.get(course.id) ?? [],
        rankSignal: rankSignals.get(course.id) ?? null
      }))
      .filter((course) => matchesRankSignalFilter(course.rankSignal, signalFilter))
      .slice(0, limit);
  }

  const admin = createAdminClient();
  const [courses, aggregateRows] = await Promise.all([
    getAllCourses(),
    admin.from("course_aggregates").select("*").order("rank", { ascending: true }).limit(400)
  ]);

  if (aggregateRows.error) {
    throw new Error(aggregateRows.error.message);
  }

  const aggregateByCourse = new Map(
    ((aggregateRows.data ?? []) as CourseAggregateRecord[]).map((row) => [row.course_id, row])
  );

  let leaderboard = courses
    .map((course) => toLeaderboardCourse(course, aggregateByCourse.get(course.id) ?? null))
    .filter((course) => course.numSignals >= minSignals)
    .filter((course) => (selectedState ? course.state.toUpperCase() === selectedState : true));
  const playedIds = viewerId ? await getPlayedCourseIdsForUser(viewerId) : null;

  if (playedIds && activity !== "all") {
    leaderboard = leaderboard.filter((course) =>
      activity === "played" ? playedIds.has(course.id) : !playedIds.has(course.id)
    );
  }

  const preparedRows = assignEditorialAverageRanks(leaderboard);
  const sortedRows = sortLeaderboardRows(preparedRows, sort);
  const [friendPresence, rankSignals] = await Promise.all([
    viewerId
      ? getAcceptedFriendPresenceMap(viewerId, sortedRows.map((course) => course.id))
      : Promise.resolve(new Map<string, FriendPresence[]>()),
    getRankSignalMap(sortedRows)
  ]);

  return sortedRows
    .map((course) => ({
      ...course,
      viewerPlayed: playedIds?.has(course.id) ?? false,
      friendPlayers: friendPresence.get(course.id) ?? [],
      rankSignal: rankSignals.get(course.id) ?? null
    }))
    .filter((course) => matchesRankSignalFilter(course.rankSignal, signalFilter))
    .slice(0, limit);
}

export async function getCourseDetail(
  courseId: string,
  viewerId: string | null = null,
  viewerBand: HandicapBand | null = null
): Promise<CourseDetail | null> {
  const { configured } = ensureConfigured();

  if (!configured) {
    return null;
  }

  let resolvedCourseId = courseId;
  if (!isUuidLike(courseId)) {
    const allCourses = await getAllCourses();
    const matchingCourse = allCourses.find((course) => slugifyCourseName(course.name) === courseId);
    if (!matchingCourse) {
      return null;
    }
    resolvedCourseId = matchingCourse.id;
  }

  const admin = createAdminClient();
  const [courseRes, aggregateRes, noteRows, viewerPlayedRows, viewerRankRows, viewerWishlistRows] = await Promise.all([
    admin.from("courses").select("*").eq("id", resolvedCourseId).maybeSingle<CourseRecord>(),
    admin.from("course_aggregates").select("*").eq("course_id", resolvedCourseId).maybeSingle<CourseAggregateRecord>(),
    admin
      .from("played_courses")
      .select("note")
      .eq("course_id", resolvedCourseId)
      .not("note", "is", null)
      .limit(18),
    viewerId
      ? admin.from("played_courses").select("*").eq("user_id", viewerId).eq("course_id", resolvedCourseId)
      : Promise.resolve({ data: [], error: null }),
    viewerId
      ? admin.from("user_course_ranks").select("*").eq("user_id", viewerId).eq("course_id", resolvedCourseId)
      : Promise.resolve({ data: [], error: null }),
    viewerId
      ? admin.from("wishlist_courses").select("course_id").eq("user_id", viewerId).eq("course_id", resolvedCourseId)
      : Promise.resolve({ data: [], error: null })
  ]);

  if (courseRes.error) {
    throw new Error(courseRes.error.message);
  }

  if (aggregateRes.error) {
    throw new Error(aggregateRes.error.message);
  }

  if (noteRows.error) {
    throw new Error(noteRows.error.message);
  }

  if (viewerPlayedRows.error) {
    throw new Error(viewerPlayedRows.error.message);
  }

  if (viewerRankRows.error) {
    throw new Error(viewerRankRows.error.message);
  }

  if (viewerWishlistRows.error && !isMissingWishlistTableError(viewerWishlistRows.error)) {
    throw new Error(viewerWishlistRows.error.message);
  }

  const course = courseRes.data ? attachEditorialRanks([courseRes.data as CourseRecord])[0] : null;

  if (!course) {
    return null;
  }

  const noteSamples = ((noteRows.data ?? []) as Array<{ note: string | null }>)
    .map((row) => row.note?.trim())
    .filter(Boolean) as string[];
  const viewerPlayed = buildPlayedCourses(
    [course],
    (viewerPlayedRows.data ?? []) as PlayedCourseRecord[],
    (viewerRankRows.data ?? []) as RankRow[]
  )[0] ?? null;

  return {
    course,
    aggregate: (aggregateRes.data as CourseAggregateRecord | null) ?? null,
    aiSummary: buildAiCourseStory(course, (aggregateRes.data as CourseAggregateRecord | null) ?? null, noteSamples, viewerBand),
    viewerPlayed,
    viewerWishlisted: ((viewerWishlistRows.data ?? []) as Array<{ course_id: string }>).length > 0
  };
}

export async function getFriendshipBetweenUsers(userA: string, userB: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("friendships")
    .select("*")
    .or(
      `and(requester_user_id.eq.${userA},addressee_user_id.eq.${userB}),and(requester_user_id.eq.${userB},addressee_user_id.eq.${userA})`
    )
    .maybeSingle<FriendshipRecord>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

export async function searchDiscoverableProfiles(query: string, viewerId?: string | null) {
  const { configured } = ensureConfigured();

  if (!configured || query.trim().length < 2) {
    return [] as DiscoverableProfile[];
  }

  const admin = createAdminClient();
  const escaped = query.trim().replace(/[%*,]/g, "");
  const { data, error } = await admin
    .from("users")
    .select("id, handle, display_name, email, home_state, handicap_band")
    .eq("discoverability_enabled", true)
    .neq("profile_visibility", "private")
    .or(`handle.ilike.%${escaped}%,display_name.ilike.%${escaped}%,email.ilike.%${escaped}%`)
    .limit(12);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as DiscoverableProfile[]).filter((profile) => profile.id !== viewerId);
}

export async function getFriendsPageData(viewerId: string): Promise<FriendsPageData> {
  const { configured } = ensureConfigured();

  if (!configured) {
    return { accepted: [], incoming: [], outgoing: [] };
  }

  const admin = createAdminClient();
  const [friendshipsRes, viewerRanks] = await Promise.all([
    admin
      .from("friendships")
      .select("*")
      .or(`requester_user_id.eq.${viewerId},addressee_user_id.eq.${viewerId}`)
      .order("created_at", { ascending: false }),
    getRankedCoursesForUser(viewerId)
  ]);

  if (friendshipsRes.error) {
    throw new Error(friendshipsRes.error.message);
  }

  const friendships = (friendshipsRes.data ?? []) as FriendshipRecord[];
  const otherIds = Array.from(
    new Set(
      friendships.map((friendship) =>
        friendship.requester_user_id === viewerId ? friendship.addressee_user_id : friendship.requester_user_id
      )
    )
  );

  const profiles = otherIds.length
    ? (
        (
          await admin
            .from("users")
            .select("*")
            .in("id", otherIds)
        ).data ?? []
      ) as UserProfile[]
    : [];

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const viewerRankIds = new Set(viewerRanks.map((course) => course.id));

  const accepted: FriendCard[] = [];
  const incoming: PendingFriendRequest[] = [];
  const outgoing: PendingFriendRequest[] = [];

  for (const friendship of friendships) {
    const otherId =
      friendship.requester_user_id === viewerId ? friendship.addressee_user_id : friendship.requester_user_id;
    const profile = profileById.get(otherId);

    if (!profile) {
      continue;
    }

    if (friendship.status === "accepted") {
      const friendRanks = await getRankedCoursesForUser(otherId);
      const overlapCount = friendRanks.filter((course) => viewerRankIds.has(course.id)).length;

      accepted.push({
        profile,
        overlapCount,
        rankedCount: friendRanks.length,
        friendshipId: friendship.id
      });
      continue;
    }

    const pending: PendingFriendRequest = {
      id: friendship.id,
      direction: friendship.addressee_user_id === viewerId ? "incoming" : "outgoing",
      profile,
      created_at: friendship.created_at
    };

    if (pending.direction === "incoming") {
      incoming.push(pending);
    } else {
      outgoing.push(pending);
    }
  }

  accepted.sort((left, right) => right.overlapCount - left.overlapCount || left.profile.display_name?.localeCompare(right.profile.display_name ?? "") || 0);

  return {
    accepted,
    incoming,
    outgoing
  };
}

export async function getPublicProfileOverview(
  handle: string,
  viewerId: string | null = null
): Promise<PublicProfileOverview | null> {
  const profile = await getProfileByHandle(handle);

  if (!profile) {
    return null;
  }

  const friendship =
    viewerId && viewerId !== profile.id ? await getFriendshipBetweenUsers(viewerId, profile.id) : null;
  const visibilityState = canViewerSeeProfile(profile, viewerId, friendship);

  if (visibilityState !== "visible") {
    return {
      profile,
      stats: {
        playedCount: 0,
        rankedCount: 0,
        comparisonsMade: 0,
        topHundredPlayedCount: 0,
        friendsCount: 0
      },
      topCourses: [],
      wishlistCourses: [],
      canCompare: false,
      visibilityState
    };
  }

  const admin = createAdminClient();
  const [played, ranked, wishlistCourses, friendsData, pairwiseCount] = await Promise.all([
    getPlayedCoursesForUser(profile.id),
    getRankedCoursesForUser(profile.id),
    getWishlistCoursesForUser(profile.id),
    getFriendsPageData(profile.id),
    admin
      .from("pairwise_signals")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
  ]);

  if (pairwiseCount.error) {
    throw new Error(pairwiseCount.error.message);
  }

  return {
    profile,
    stats: {
      playedCount: played.length,
      rankedCount: ranked.length,
      comparisonsMade: pairwiseCount.count ?? 0,
      topHundredPlayedCount: played.filter((course) => course.seed_rank <= 100).length,
      friendsCount: friendsData.accepted.length
    },
    topCourses: ranked.slice(0, 10),
    wishlistCourses,
    canCompare: Boolean(viewerId && viewerId !== profile.id && friendship?.status !== "accepted"),
    visibilityState
  };
}

export async function getCompareOverview(
  viewerId: string,
  friendUserIdOrHandle: string
): Promise<CompareOverview | null> {
  const friendProfile = isUuidLike(friendUserIdOrHandle)
    ? await getProfileById(friendUserIdOrHandle)
    : await getProfileByHandle(friendUserIdOrHandle);

  if (!friendProfile) {
    return null;
  }

  const friendship = await getFriendshipBetweenUsers(viewerId, friendProfile.id);

  if (!friendship || friendship.status !== "accepted") {
    return null;
  }

  const [selfCourses, friendCourses] = await Promise.all([
    getRankedCoursesForUser(viewerId),
    getRankedCoursesForUser(friendProfile.id)
  ]);

  const comparison = compareRankings(selfCourses, friendCourses);

  return {
    friend: friendProfile,
    overlap: comparison.overlap,
    selfOnlyCount: comparison.selfOnlyCount,
    friendOnlyCount: comparison.friendOnlyCount
  };
}

export async function getAppOverviewStats() {
  const { configured } = ensureConfigured();

  if (!configured) {
    return {
      courseCount: 0,
      golferCount: 0,
      signalCount: 0
    };
  }

  const admin = createAdminClient();
  const [{ count: courseCount }, { count: golferCount }, { count: signalCount }] = await Promise.all([
    admin.from("courses").select("*", { count: "exact", head: true }),
    admin.from("users").select("*", { count: "exact", head: true }).eq("onboarding_completed", true),
    admin.from("pairwise_signals").select("*", { count: "exact", head: true })
  ]);

  return {
    courseCount: courseCount ?? 0,
    golferCount: golferCount ?? 0,
    signalCount: signalCount ?? 0
  };
}

export async function recordEmailNotification(input: {
  recipientUserId: string;
  notificationType: EmailNotificationType;
  dedupeKey: string;
  actorUserId?: string | null;
  payload?: Record<string, unknown>;
}) {
  const { configured } = ensureConfigured();

  if (!configured) {
    return false;
  }

  const admin = createAdminClient();
  const result = await admin.from("email_notifications").insert({
    recipient_user_id: input.recipientUserId,
    actor_user_id: input.actorUserId ?? null,
    notification_type: input.notificationType,
    dedupe_key: input.dedupeKey,
    payload: input.payload ?? {}
  });

  if (result.error) {
    if (result.error.code === "23505") {
      return false;
    }

    throw new Error(result.error.message);
  }

  return true;
}

export async function getUnrankedReminderCandidates() {
  const { configured } = ensureConfigured();

  if (!configured) {
    return [] as UnrankedReminderCandidate[];
  }

  const admin = createAdminClient();
  const [{ data: usersData, error: usersError }, { data: playedData, error: playedError }, { data: rankedData, error: rankedError }, { data: notificationData, error: notificationError }] =
    await Promise.all([
      admin.from("users").select("*").eq("onboarding_completed", true).not("email", "is", null),
      admin.from("played_courses").select("user_id, course_id, played_at"),
      admin.from("user_course_ranks").select("user_id, course_id"),
      admin
        .from("email_notifications")
        .select("recipient_user_id, notification_type, created_at")
        .eq("notification_type", "unranked-reminder")
    ]);

  if (usersError) {
    throw new Error(usersError.message);
  }

  if (playedError) {
    throw new Error(playedError.message);
  }

  if (rankedError) {
    throw new Error(rankedError.message);
  }

  if (notificationError) {
    throw new Error(notificationError.message);
  }

  const users = (usersData ?? []) as UserProfile[];
  const playedRows = (playedData ?? []) as Array<{ user_id: string; course_id: string; played_at: string }>;
  const rankedRows = (rankedData ?? []) as Array<{ user_id: string; course_id: string }>;
  const notificationRows = (notificationData ?? []) as Array<{
    recipient_user_id: string;
    notification_type: EmailNotificationType;
    created_at: string;
  }>;

  const playedByUser = new Map<string, Array<{ courseId: string; playedAt: string }>>();
  const rankedByUser = new Map<string, Set<string>>();
  const reminderByUser = new Map<string, string[]>();

  for (const row of playedRows) {
    const current = playedByUser.get(row.user_id) ?? [];
    current.push({ courseId: row.course_id, playedAt: row.played_at });
    playedByUser.set(row.user_id, current);
  }

  for (const row of rankedRows) {
    const current = rankedByUser.get(row.user_id) ?? new Set<string>();
    current.add(row.course_id);
    rankedByUser.set(row.user_id, current);
  }

  for (const row of notificationRows) {
    const current = reminderByUser.get(row.recipient_user_id) ?? [];
    current.push(row.created_at);
    reminderByUser.set(row.recipient_user_id, current);
  }

  const allCourseIds = Array.from(new Set(playedRows.map((row) => row.course_id)));
  const allCourses = await getCoursesByIds(allCourseIds);
  const courseNameById = new Map(allCourses.map((course) => [course.id, course.name]));
  const now = Date.now();
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;
  const seventyTwoHoursMs = 72 * 60 * 60 * 1000;
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

  const candidates = users
    .map<UnrankedReminderCandidate | null>((profile) => {
      const played = [...(playedByUser.get(profile.id) ?? [])].sort((left, right) =>
        right.playedAt.localeCompare(left.playedAt)
      );
      const ranked = rankedByUser.get(profile.id) ?? new Set<string>();

      if (played.length === 0) {
        return null;
      }

      const rankedCount = ranked.size;
      const qualifies = (played.length >= 3 && rankedCount === 0) || (played.length >= 5 && rankedCount < 3);

      if (!qualifies) {
        return null;
      }

      const latestPlayedAt = played[0]?.playedAt;
      if (!latestPlayedAt) {
        return null;
      }

      const reminderDates = (reminderByUser.get(profile.id) ?? []).sort((left, right) => right.localeCompare(left));
      const reminderCount = reminderDates.length;
      const remindersLast14Days = reminderDates.filter((date) => now - new Date(date).getTime() < fourteenDaysMs).length;
      const lastReminderAt = reminderDates[0] ?? null;
      const msSinceLatestPlayed = now - new Date(latestPlayedAt).getTime();
      const msSinceLastReminder = lastReminderAt ? now - new Date(lastReminderAt).getTime() : Number.MAX_SAFE_INTEGER;

      if (reminderCount >= 3) {
        return null;
      }

      if (remindersLast14Days >= 2) {
        return null;
      }

      if (reminderCount === 0 && msSinceLatestPlayed < twentyFourHoursMs) {
        return null;
      }

      if (reminderCount > 0 && msSinceLastReminder < seventyTwoHoursMs) {
        return null;
      }

      return {
        profile,
        playedCount: played.length,
        rankedCount,
        latestPlayedAt,
        sampleCourses: played
          .slice(0, 3)
          .map((row) => courseNameById.get(row.courseId))
          .filter(Boolean) as string[],
        reminderCount,
        remindersLast14Days,
        lastReminderAt
      };
    })
    .filter(Boolean) as UnrankedReminderCandidate[];

  return candidates.sort((left, right) => right.latestPlayedAt.localeCompare(left.latestPlayedAt));
}

export async function getProfileSummary(viewerId: string) {
  const [profile, played, ranked, friends, wishlist] = await Promise.all([
    getProfileById(viewerId),
    getPlayedCoursesForUser(viewerId),
    getRankedCoursesForUser(viewerId),
    getFriendsPageData(viewerId),
    getWishlistCoursesForUser(viewerId)
  ]);

  return {
    profile,
    playedCount: played.length,
    rankedCount: ranked.length,
    wishlistCount: wishlist.length,
    acceptedFriends: friends.accepted.length,
    incomingRequests: friends.incoming.length
  };
}

export async function logAnalyticsEvent(input: {
  userId?: string | null;
  eventName: AnalyticsEventName;
  payload?: Record<string, unknown>;
}) {
  const { configured } = ensureConfigured();

  if (!configured) {
    return;
  }

  const admin = createAdminClient();
  const result = await admin.from("analytics_events").insert({
    user_id: input.userId ?? null,
    event_name: input.eventName,
    event_payload: input.payload ?? {}
  });

  if (result.error) {
    throw new Error(result.error.message);
  }
}

export async function upsertProfileSettings(input: {
  userId: string;
  displayName: string | null;
  handle: string;
  homeState: string | null;
  profileVisibility: ProfileVisibility;
  handicapVisibility: boolean;
  discoverabilityEnabled: boolean;
}) {
  const admin = createAdminClient();
  const currentProfile = await getProfileById(input.userId);

  if (!currentProfile) {
    throw new Error("Profile not found.");
  }

  const normalizedHandle = sanitizeHandle(input.handle);

  if (normalizedHandle !== currentProfile.handle && currentProfile.free_handle_change_used_at) {
    throw new Error("Your free handle change has already been used.");
  }

  const collision = await admin
    .from("users")
    .select("id")
    .eq("handle", normalizedHandle)
    .neq("id", input.userId)
    .maybeSingle<{ id: string }>();

  if (collision.error) {
    throw new Error(collision.error.message);
  }

  if (collision.data) {
    throw new Error("That handle is already taken.");
  }

  const result = await admin
    .from("users")
    .update({
      display_name: input.displayName?.trim() || null,
      handle: normalizedHandle,
      home_state: sanitizeStateCode(input.homeState),
      profile_visibility: input.profileVisibility,
      handicap_visibility: input.handicapVisibility,
      discoverability_enabled: input.discoverabilityEnabled,
      free_handle_change_used_at:
        normalizedHandle !== currentProfile.handle && !currentProfile.free_handle_change_used_at
          ? new Date().toISOString()
          : currentProfile.free_handle_change_used_at
    })
    .eq("id", input.userId)
    .select("*")
    .single<UserProfile>();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export async function getAdminFeedbackEntries(limit = 100) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const feedback = (data ?? []) as FeedbackRecord[];
  const userIds = Array.from(new Set(feedback.map((row) => row.user_id).filter(Boolean))) as string[];

  if (userIds.length === 0) {
    return feedback;
  }

  const { data: profiles, error: profileError } = await admin.from("users").select("id, email").in("id", userIds);

  if (profileError) {
    throw new Error(profileError.message);
  }

  const profileById = new Map(((profiles ?? []) as Array<{ id: string; email: string | null }>).map((row) => [row.id, row.email]));

  return feedback.map((row) => ({
    ...row,
    viewer_email: row.user_id ? profileById.get(row.user_id) ?? null : null
  }));
}

export function getSetupState() {
  const { env, configured } = ensureConfigured();
  return {
    configured,
    missing: env.missing
  };
}
