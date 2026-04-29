"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  ensureProfileForUser,
  getFriendshipBetweenUsers,
  getPlayedCoursesForUser,
  getProfileById,
  getRankedCoursesForUser
} from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  FEEDBACK_TYPES,
  FRIENDSHIP_STATUSES,
  HANDICAP_OPTIONS,
  type FeedbackType,
  type PlayedCourse,
  type RankedCourse
} from "@/lib/types";
import { getViewerContext, requireAdminViewer, requireOnboardedViewer, requireViewer } from "@/lib/viewer";

type ActionResult<T> = {
  ok: boolean;
  message?: string;
  data?: T;
};

function isHandicapBand(value: string): value is (typeof HANDICAP_OPTIONS)[number] {
  return HANDICAP_OPTIONS.includes(value as (typeof HANDICAP_OPTIONS)[number]);
}

function isFeedbackType(value: string): value is FeedbackType {
  return FEEDBACK_TYPES.includes(value as FeedbackType);
}

function isFriendshipStatus(value: string) {
  return FRIENDSHIP_STATUSES.includes(value as (typeof FRIENDSHIP_STATUSES)[number]);
}

function appPaths(handle?: string | null) {
  return [
    "/",
    "/leaderboard",
    "/courses",
    "/me/courses",
    "/friends",
    "/feedback",
    "/profile",
    "/admin/feedback",
    ...(handle ? [`/profile/${handle}`] : [])
  ];
}

function revalidateApp(handle?: string | null) {
  for (const path of appPaths(handle)) {
    revalidatePath(path);
  }
}

async function rebuildSignalsForUser(userId: string) {
  const admin = createAdminClient();
  const rpc = await admin.rpc("rebuild_user_pairwise_signals", {
    target_user_id: userId
  });

  if (rpc.error) {
    throw new Error(rpc.error.message);
  }
}

export async function completeOnboarding(formData: FormData) {
  const next = typeof formData.get("next") === "string" ? String(formData.get("next")) : "/leaderboard";
  const handicapBandValue = formData.get("handicap_band");

  if (typeof handicapBandValue !== "string" || !isHandicapBand(handicapBandValue)) {
    redirect(`/onboarding?next=${encodeURIComponent(next)}&error=Choose+one+handicap+band`);
  }

  const viewer = await requireViewer("/onboarding");
  const admin = createAdminClient();

  const result = await admin
    .from("users")
    .update({
      handicap_band: handicapBandValue,
      onboarding_completed: true
    })
    .eq("id", viewer.user!.id);

  if (result.error) {
    redirect(`/onboarding?next=${encodeURIComponent(next)}&error=${encodeURIComponent(result.error.message)}`);
  }

  revalidateApp(viewer.profile?.handle);
  redirect(next.startsWith("/") ? next : "/leaderboard");
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/sign-in?signed_out=1");
}

export async function setCoursePlayed(courseId: string, played: boolean): Promise<ActionResult<PlayedCourse[]>> {
  const viewer = await requireOnboardedViewer("/courses");
  const admin = createAdminClient();
  const userId = viewer.user!.id;

  if (played) {
    const result = await admin.from("played_courses").upsert(
      {
        user_id: userId,
        course_id: courseId
      },
      {
        onConflict: "user_id,course_id",
        ignoreDuplicates: false
      }
    );

    if (result.error) {
      return {
        ok: false,
        message: result.error.message
      };
    }
  } else {
    const [rankDelete, playedDelete] = await Promise.all([
      admin.from("user_course_ranks").delete().eq("user_id", userId).eq("course_id", courseId),
      admin.from("played_courses").delete().eq("user_id", userId).eq("course_id", courseId)
    ]);

    if (rankDelete.error) {
      return {
        ok: false,
        message: rankDelete.error.message
      };
    }

    if (playedDelete.error) {
      return {
        ok: false,
        message: playedDelete.error.message
      };
    }

    await rebuildSignalsForUser(userId);
  }

  const updated = await getPlayedCoursesForUser(userId);
  revalidateApp(viewer.profile?.handle);

  return {
    ok: true,
    data: updated
  };
}

export async function addCourseToRanking(courseId: string): Promise<ActionResult<RankedCourse[]>> {
  const viewer = await requireOnboardedViewer("/me/courses");
  const admin = createAdminClient();
  const userId = viewer.user!.id;

  const [playedRows, rankCount] = await Promise.all([
    admin.from("played_courses").select("course_id").eq("user_id", userId).eq("course_id", courseId).maybeSingle(),
    admin.from("user_course_ranks").select("course_id", { count: "exact", head: true }).eq("user_id", userId)
  ]);

  if (playedRows.error) {
    return {
      ok: false,
      message: playedRows.error.message
    };
  }

  if (!playedRows.data) {
    return {
      ok: false,
      message: "Mark the course as played first."
    };
  }

  const upsert = await admin.from("user_course_ranks").upsert(
    {
      user_id: userId,
      course_id: courseId,
      rank_position: rankCount.count ?? 0
    },
    {
      onConflict: "user_id,course_id"
    }
  );

  if (upsert.error) {
    return {
      ok: false,
      message: upsert.error.message
    };
  }

  await rebuildSignalsForUser(userId);
  const ranked = await getRankedCoursesForUser(userId);
  revalidateApp(viewer.profile?.handle);

  return {
    ok: true,
    data: ranked
  };
}

export async function removeCourseFromRanking(courseId: string): Promise<ActionResult<PlayedCourse[]>> {
  const viewer = await requireOnboardedViewer("/me/courses");
  const admin = createAdminClient();
  const userId = viewer.user!.id;

  const remove = await admin.from("user_course_ranks").delete().eq("user_id", userId).eq("course_id", courseId);

  if (remove.error) {
    return {
      ok: false,
      message: remove.error.message
    };
  }

  await rebuildSignalsForUser(userId);
  const played = await getPlayedCoursesForUser(userId);
  revalidateApp(viewer.profile?.handle);

  return {
    ok: true,
    data: played
  };
}

export async function saveCourseOrder(courseIds: string[]): Promise<ActionResult<RankedCourse[]>> {
  const viewer = await requireOnboardedViewer("/me/courses");
  const admin = createAdminClient();
  const userId = viewer.user!.id;
  const existing = await getRankedCoursesForUser(userId);
  const existingIds = existing.map((course) => course.id).sort();
  const submittedIds = [...courseIds].sort();

  if (existingIds.join("|") !== submittedIds.join("|")) {
    return {
      ok: false,
      message: "Your ranking changed in another tab. Refresh and try again."
    };
  }

  const deleteResult = await admin.from("user_course_ranks").delete().eq("user_id", userId);

  if (deleteResult.error) {
    return {
      ok: false,
      message: deleteResult.error.message
    };
  }

  if (courseIds.length > 0) {
    const insertResult = await admin.from("user_course_ranks").insert(
      courseIds.map((courseId, index) => ({
        user_id: userId,
        course_id: courseId,
        rank_position: index
      }))
    );

    if (insertResult.error) {
      return {
        ok: false,
        message: insertResult.error.message
      };
    }
  }

  await rebuildSignalsForUser(userId);
  const ranked = await getRankedCoursesForUser(userId);
  revalidateApp(viewer.profile?.handle);

  return {
    ok: true,
    data: ranked,
    message: new Date().toISOString()
  };
}

export async function saveCourseNote(courseId: string, note: string): Promise<ActionResult<PlayedCourse | null>> {
  const viewer = await requireOnboardedViewer(`/courses/${courseId}`);
  const admin = createAdminClient();
  const userId = viewer.user!.id;

  const update = await admin
    .from("played_courses")
    .update({
      note: note.trim() || null
    })
    .eq("user_id", userId)
    .eq("course_id", courseId);

  if (update.error) {
    return {
      ok: false,
      message: update.error.message
    };
  }

  const played = await getPlayedCoursesForUser(userId);
  const match = played.find((course) => course.id === courseId) ?? null;
  revalidateApp(viewer.profile?.handle);
  revalidatePath(`/courses/${courseId}`);

  return {
    ok: true,
    data: match,
    message: new Date().toISOString()
  };
}

export async function sendFriendRequest(email: string): Promise<ActionResult<null>> {
  const viewer = await requireOnboardedViewer("/friends");
  const admin = createAdminClient();
  const cleanedEmail = email.trim().toLowerCase();

  if (!cleanedEmail.includes("@")) {
    return {
      ok: false,
      message: "Enter a valid email address."
    };
  }

  if (cleanedEmail === viewer.user!.email?.toLowerCase()) {
    return {
      ok: false,
      message: "You are already extremely connected to yourself."
    };
  }

  const target = await admin.from("users").select("*").eq("email", cleanedEmail).maybeSingle();

  if (target.error) {
    return {
      ok: false,
      message: target.error.message
    };
  }

  if (!target.data) {
    return {
      ok: false,
      message: "That golfer needs to create an account before you can connect."
    };
  }

  const existing = await getFriendshipBetweenUsers(viewer.user!.id, target.data.id);

  if (existing) {
    return {
      ok: false,
      message: existing.status === "accepted" ? "You are already friends." : "That request is already pending."
    };
  }

  const insert = await admin.from("friendships").insert({
    requester_user_id: viewer.user!.id,
    addressee_user_id: target.data.id,
    status: "pending"
  });

  if (insert.error) {
    return {
      ok: false,
      message: insert.error.message
    };
  }

  revalidateApp(viewer.profile?.handle);
  return {
    ok: true,
    message: "Friend request sent."
  };
}

export async function respondToFriendRequest(
  friendshipId: string,
  status: string
): Promise<ActionResult<null>> {
  const viewer = await requireOnboardedViewer("/friends");

  if (!isFriendshipStatus(status)) {
    return {
      ok: false,
      message: "Unknown friendship status."
    };
  }

  const admin = createAdminClient();
  const friendship = await admin
    .from("friendships")
    .select("*")
    .eq("id", friendshipId)
    .maybeSingle();

  if (friendship.error) {
    return {
      ok: false,
      message: friendship.error.message
    };
  }

  if (!friendship.data || friendship.data.addressee_user_id !== viewer.user!.id) {
    return {
      ok: false,
      message: "That request is no longer available."
    };
  }

  const update = await admin
    .from("friendships")
    .update({
      status,
      responded_at: new Date().toISOString()
    })
    .eq("id", friendshipId);

  if (update.error) {
    return {
      ok: false,
      message: update.error.message
    };
  }

  revalidateApp(viewer.profile?.handle);
  return {
    ok: true,
    message: status === "accepted" ? "Friend request accepted." : "Request updated."
  };
}

export async function submitFeedback(input: {
  feedbackType: string;
  message: string;
  screenName: string;
  currentUrl: string;
  userAgent?: string;
  clientSubmissionId: string;
}): Promise<ActionResult<null>> {
  if (!isFeedbackType(input.feedbackType)) {
    return {
      ok: false,
      message: "Pick bug, feature, or general before you send feedback."
    };
  }

  if (input.message.trim().length < 4) {
    return {
      ok: false,
      message: "A little more detail will help us act on the feedback."
    };
  }

  const viewer = await getViewerContext();
  const admin = createAdminClient();

  const result = await admin.from("feedback").upsert(
    {
      user_id: viewer.user?.id ?? null,
      feedback_type: input.feedbackType,
      screen_name: input.screenName || "Unknown screen",
      current_url: input.currentUrl || "/feedback",
      message: input.message.trim(),
      browser_context: {
        user_agent: input.userAgent ?? "unknown"
      },
      client_submission_id: input.clientSubmissionId
    },
    {
      onConflict: "client_submission_id"
    }
  );

  if (result.error) {
    return {
      ok: false,
      message: result.error.message
    };
  }

  revalidatePath("/feedback");
  if (viewer.isAdmin) {
    revalidatePath("/admin/feedback");
  }

  return {
    ok: true,
    message: "Feedback captured. Thanks for helping shape the next cut."
  };
}

export async function deleteFeedbackEntry(feedbackId: string): Promise<ActionResult<null>> {
  await requireAdminViewer("/admin/feedback");
  const admin = createAdminClient();
  const result = await admin.from("feedback").delete().eq("id", feedbackId);

  if (result.error) {
    return {
      ok: false,
      message: result.error.message
    };
  }

  revalidatePath("/admin/feedback");
  return {
    ok: true,
    message: "Feedback removed."
  };
}

export async function refreshProfileFromSession() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    await ensureProfileForUser(user);
  }
}
