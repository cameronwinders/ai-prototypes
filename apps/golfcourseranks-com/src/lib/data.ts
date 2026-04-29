import "server-only";

import type { User } from "@supabase/supabase-js";

import { buildAiCourseStory, compareRankings, toLeaderboardCard } from "@/lib/ranking";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSupabaseEnv } from "@/lib/supabase/env";
import type {
  CourseRatingRecord,
  CourseRecord,
  HandicapBand,
  LeaderboardCourse,
  RankedCourse,
  UserProfile
} from "@/lib/types";

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
  const { data, error } = await admin
    .from("courses")
    .select("*")
    .order("name", { ascending: true })
    .limit(250);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CourseRecord[];
}

async function getCoursesByIds(courseIds: string[]) {
  if (courseIds.length === 0) {
    return [] as CourseRecord[];
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("courses")
    .select("*")
    .in("id", courseIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CourseRecord[];
}

async function getRatingsByCourseIds(courseIds: string[]) {
  if (courseIds.length === 0) {
    return [] as CourseRatingRecord[];
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("course_ratings")
    .select("*")
    .in("course_id", courseIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CourseRatingRecord[];
}

export async function getRankedCoursesForUser(userId: string) {
  const { configured } = ensureConfigured();

  if (!configured) {
    return [] as RankedCourse[];
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_rankings")
    .select("course_id, rank_index")
    .eq("user_id", userId)
    .order("rank_index", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rankings = (data ?? []) as { course_id: string; rank_index: number }[];
  const courses = await getCoursesByIds(rankings.map((entry) => entry.course_id));
  const byId = new Map(courses.map((course) => [course.id, course]));

  return rankings
    .map((entry) => {
      const course = byId.get(entry.course_id);
      if (!course) {
        return null;
      }

      return {
        ...course,
        rankIndex: entry.rank_index
      };
    })
    .filter(Boolean) as RankedCourse[];
}

export async function getLeaderboardCourses(limit = 100) {
  const { configured } = ensureConfigured();

  if (!configured) {
    return [] as LeaderboardCourse[];
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("course_ratings")
    .select("*")
    .eq("is_eligible", true)
    .order("rank", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const ratings = (data ?? []) as CourseRatingRecord[];
  const courses = await getCoursesByIds(ratings.map((entry) => entry.course_id));
  const byId = new Map(courses.map((course) => [course.id, course]));

  return ratings
    .map((rating) => {
      const course = byId.get(rating.course_id);
      return course ? toLeaderboardCard(course, rating) : null;
    })
    .filter(Boolean) as LeaderboardCourse[];
}

export async function getCourseDetail(courseId: string, viewerBand: HandicapBand | null = null) {
  const { configured } = ensureConfigured();

  if (!configured) {
    return null;
  }

  const admin = createAdminClient();
  const [{ data: course, error: courseError }, { data: rating, error: ratingError }] = await Promise.all([
    admin.from("courses").select("*").eq("id", courseId).maybeSingle<CourseRecord>(),
    admin.from("course_ratings").select("*").eq("course_id", courseId).maybeSingle<CourseRatingRecord>()
  ]);

  if (courseError) {
    throw new Error(courseError.message);
  }

  if (ratingError) {
    throw new Error(ratingError.message);
  }

  if (!course) {
    return null;
  }

  return {
    course,
    rating: rating ?? null,
    aiStory: buildAiCourseStory(course, rating ?? null, viewerBand)
  };
}

export async function getFriendsOverview(viewerId: string) {
  const { configured } = ensureConfigured();

  if (!configured) {
    return {
      followedProfiles: [] as Array<{
        profile: UserProfile;
        topCourses: RankedCourse[];
      }>,
      discoveryProfiles: [] as UserProfile[]
    };
  }

  const admin = createAdminClient();
  const { data: follows, error: followsError } = await admin
    .from("follows")
    .select("followed_user_id")
    .eq("follower_user_id", viewerId);

  if (followsError) {
    throw new Error(followsError.message);
  }

  const followedIds = ((follows ?? []) as { followed_user_id: string }[]).map(
    (entry) => entry.followed_user_id
  );

  const followedProfiles = followedIds.length
    ? ((await admin
        .from("users")
        .select("*")
        .in("id", followedIds)
        .order("display_name", { ascending: true })).data ?? []) as UserProfile[]
    : [];

  const followedWithCourses = await Promise.all(
    followedProfiles.map(async (profile) => ({
      profile,
      topCourses: (await getRankedCoursesForUser(profile.id)).slice(0, 3)
    }))
  );

  const { data: discovery, error: discoveryError } = await admin
    .from("users")
    .select("*")
    .neq("id", viewerId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (discoveryError) {
    throw new Error(discoveryError.message);
  }

  const discoveryProfiles = ((discovery ?? []) as UserProfile[]).filter(
    (profile) => !followedIds.includes(profile.id) && profile.onboarding_completed
  );

  return {
    followedProfiles: followedWithCourses,
    discoveryProfiles: discoveryProfiles.slice(0, 6)
  };
}

export async function getProfileOverview(handle: string, viewerId?: string | null) {
  const profile = await getProfileByHandle(handle);

  if (!profile) {
    return null;
  }

  const admin = createAdminClient();
  const [rankings, followerRows, followingRows, followState] = await Promise.all([
    getRankedCoursesForUser(profile.id),
    admin.from("follows").select("follower_user_id").eq("followed_user_id", profile.id),
    admin.from("follows").select("followed_user_id").eq("follower_user_id", profile.id),
    viewerId
      ? admin
          .from("follows")
          .select("followed_user_id")
          .eq("follower_user_id", viewerId)
          .eq("followed_user_id", profile.id)
          .maybeSingle<{ followed_user_id: string }>()
      : Promise.resolve({ data: null, error: null })
  ]);

  return {
    profile,
    rankings,
    followerCount: followerRows.data?.length ?? 0,
    followingCount: followingRows.data?.length ?? 0,
    isFollowing: Boolean(followState.data),
    isSelf: viewerId === profile.id
  };
}

export async function getComparisonOverview(viewerId: string, otherHandle: string) {
  const otherProfile = await getProfileByHandle(otherHandle);

  if (!otherProfile) {
    return null;
  }

  const [selfCourses, otherCourses] = await Promise.all([
    getRankedCoursesForUser(viewerId),
    getRankedCoursesForUser(otherProfile.id)
  ]);

  return {
    otherProfile,
    selfCourses,
    otherCourses,
    comparison: compareRankings(selfCourses, otherCourses)
  };
}

export async function getFollowState(viewerId: string, targetUserId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("follows")
    .select("followed_user_id")
    .eq("follower_user_id", viewerId)
    .eq("followed_user_id", targetUserId)
    .maybeSingle<{ followed_user_id: string }>();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
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

export function getSetupState() {
  const { env, configured } = ensureConfigured();
  return {
    configured,
    missing: env.missing
  };
}
