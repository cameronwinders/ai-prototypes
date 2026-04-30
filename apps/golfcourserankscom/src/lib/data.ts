import "server-only";

import type { User } from "@supabase/supabase-js";

import {
  buildAiCourseStory,
  compareRankings,
  computeCourseScore,
  normalizeLeaderboard,
  toLeaderboardCourse
} from "@/lib/ranking";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSupabaseEnv } from "@/lib/supabase/env";
import { EDITORIAL_LISTS } from "@/lib/types";
import type {
  CompareOverview,
  CourseAggregateRecord,
  CourseDetail,
  CourseRecord,
  FeedbackRecord,
  FriendCard,
  FriendshipRecord,
  FriendsPageData,
  EditorialKey,
  HandicapBand,
  LeaderboardCourse,
  PendingFriendRequest,
  PlayedCourse,
  PlayedCourseRecord,
  RankedCourse,
  UserProfile
} from "@/lib/types";

type LeaderboardSort =
  | "rank"
  | "score"
  | "most-played"
  | "most-compared"
  | "golf-digest-public"
  | "golf-top-100"
  | "golfweek-you-can-play";

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
  const ranksByCourse = new Map<string, Partial<Record<EditorialKey, number>>>();

  for (const editorial of EDITORIAL_LISTS) {
    const matchingCourses = [...courses]
      .filter((course) => getCourseLists(course).includes(editorial.sourceName))
      .sort((left, right) => left.seed_rank - right.seed_rank);

    matchingCourses.forEach((course, index) => {
      const existing = ranksByCourse.get(course.id) ?? {};
      existing[editorial.key] = index + 1;
      ranksByCourse.set(course.id, existing);
    });
  }

  return courses.map((course) => ({
    ...course,
    editorialLists: getCourseLists(course),
    editorialRanks: ranksByCourse.get(course.id) ?? {}
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

export async function getAllCourses() {
  const { configured } = ensureConfigured();

  if (!configured) {
    return [] as CourseRecord[];
  }

  const admin = createAdminClient();
  const [{ data, error }, { data: aggregateRows, error: aggregateError }] = await Promise.all([
    admin.from("courses").select("*").limit(250),
    admin.from("course_aggregates").select("course_id, rank, is_early").limit(250)
  ]);

  if (error) {
    throw new Error(error.message);
  }

  if (aggregateError) {
    throw new Error(aggregateError.message);
  }

  const aggregateByCourse = new Map(
    ((aggregateRows ?? []) as Array<Pick<CourseAggregateRecord, "course_id" | "rank" | "is_early">>).map((row) => [
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
    leaderboardRank: index + 1
  }));

  return normalized.slice(0, limit);
}

function sortLeaderboardRows(
  courses: LeaderboardCourse[],
  sort: LeaderboardSort
) {
  const ranked = [...courses];

  ranked.sort((left, right) => {
    if (sort === "score") {
      if (right.normalizedScore !== left.normalizedScore) {
        return right.normalizedScore - left.normalizedScore;
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

    return left.seed_rank - right.seed_rank;
  });

  return ranked.map((course, index) => ({
    ...course,
    leaderboardRank: index + 1
  }));
}

export async function getLeaderboardCourses(options?: {
  handicapBand?: HandicapBand | null;
  minSignals?: number;
  state?: string | null;
  sort?: LeaderboardSort;
  limit?: number;
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

  if (handicapBand) {
    const filteredByBand = await buildFilteredLeaderboard(handicapBand, minSignals, 250);
    const filteredByState = selectedState
      ? filteredByBand.filter((course) => course.state.toUpperCase() === selectedState)
      : filteredByBand;
    return sortLeaderboardRows(filteredByState, sort).slice(0, limit);
  }

  const admin = createAdminClient();
  const [courses, aggregateRows] = await Promise.all([
    getAllCourses(),
    admin.from("course_aggregates").select("*").order("rank", { ascending: true }).limit(250)
  ]);

  if (aggregateRows.error) {
    throw new Error(aggregateRows.error.message);
  }

  const aggregateByCourse = new Map(
    ((aggregateRows.data ?? []) as CourseAggregateRecord[]).map((row) => [row.course_id, row])
  );

  const leaderboard = courses
    .map((course) => toLeaderboardCourse(course, aggregateByCourse.get(course.id) ?? null))
    .filter((course) => course.numSignals >= minSignals)
    .filter((course) => (selectedState ? course.state.toUpperCase() === selectedState : true));

  return sortLeaderboardRows(leaderboard, sort).slice(0, limit);
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

  const admin = createAdminClient();
  const [courseRes, aggregateRes, noteRows, viewerPlayedRows, viewerRankRows] = await Promise.all([
    admin.from("courses").select("*").eq("id", courseId).maybeSingle<CourseRecord>(),
    admin.from("course_aggregates").select("*").eq("course_id", courseId).maybeSingle<CourseAggregateRecord>(),
    admin
      .from("played_courses")
      .select("note")
      .eq("course_id", courseId)
      .not("note", "is", null)
      .limit(18),
    viewerId
      ? admin.from("played_courses").select("*").eq("user_id", viewerId).eq("course_id", courseId)
      : Promise.resolve({ data: [], error: null }),
    viewerId
      ? admin.from("user_course_ranks").select("*").eq("user_id", viewerId).eq("course_id", courseId)
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

  const course = courseRes.data as CourseRecord | null;

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
    viewerPlayed
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

export async function getCompareOverview(viewerId: string, friendUserId: string): Promise<CompareOverview | null> {
  const friendship = await getFriendshipBetweenUsers(viewerId, friendUserId);

  if (!friendship || friendship.status !== "accepted") {
    return null;
  }

  const [friend, selfCourses, friendCourses] = await Promise.all([
    getProfileById(friendUserId),
    getRankedCoursesForUser(viewerId),
    getRankedCoursesForUser(friendUserId)
  ]);

  if (!friend) {
    return null;
  }

  const comparison = compareRankings(selfCourses, friendCourses);

  return {
    friend,
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

export async function getProfileSummary(viewerId: string) {
  const [profile, played, ranked, friends] = await Promise.all([
    getProfileById(viewerId),
    getPlayedCoursesForUser(viewerId),
    getRankedCoursesForUser(viewerId),
    getFriendsPageData(viewerId)
  ]);

  return {
    profile,
    playedCount: played.length,
    rankedCount: ranked.length,
    acceptedFriends: friends.accepted.length,
    incomingRequests: friends.incoming.length
  };
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
