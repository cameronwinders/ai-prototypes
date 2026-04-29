"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  ensureProfileForUser,
  getFollowState,
  getProfileByHandle,
  getRankedCoursesForUser
} from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { FEEDBACK_TYPES, HANDICAP_OPTIONS, type FeedbackType, type RankedCourse } from "@/lib/types";
import { getViewerContext, requireOnboardedViewer, requireViewer } from "@/lib/viewer";

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

function revalidateAppSurfaces(handle?: string | null) {
  revalidatePath("/leaderboard");
  revalidatePath("/my-courses");
  revalidatePath("/friends");
  revalidatePath("/feedback");

  if (handle) {
    revalidatePath(`/profile/${handle}`);
    revalidatePath(`/compare/${handle}`);
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

  await admin
    .from("users")
    .update({
      handicap_band: handicapBandValue,
      onboarding_completed: true
    })
    .eq("id", viewer.user!.id);

  revalidateAppSurfaces(viewer.profile?.handle);
  redirect(next.startsWith("/") ? next : "/leaderboard");
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/sign-in?signed_out=1");
}

export async function addPlayedCourse(courseId: string): Promise<ActionResult<RankedCourse[]>> {
  const viewer = await requireOnboardedViewer("/my-courses");
  const admin = createAdminClient();
  const userId = viewer.user!.id;

  const { data: existing } = await admin
    .from("user_courses")
    .select("course_id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle<{ course_id: string }>();

  if (!existing) {
    const [rankingCountResponse, insertCourse, courseLookup] = await Promise.all([
      admin.from("user_rankings").select("course_id", { count: "exact", head: true }).eq("user_id", userId),
      admin.from("user_courses").insert({
        user_id: userId,
        course_id: courseId
      }),
      admin.from("courses").select("id").eq("id", courseId).maybeSingle<{ id: string }>()
    ]);

    if (insertCourse.error) {
      return {
        ok: false,
        message: insertCourse.error.message
      };
    }

    if (!courseLookup.data) {
      return {
        ok: false,
        message: "That course is not in the seed catalog yet."
      };
    }

    const insertRanking = await admin.from("user_rankings").insert({
      user_id: userId,
      course_id: courseId,
      rank_index: rankingCountResponse.count ?? 0
    });

    if (insertRanking.error) {
      return {
        ok: false,
        message: insertRanking.error.message
      };
    }
  }

  await admin.rpc("rebuild_user_pairwise_signals", {
    target_user_id: userId
  });

  const rankings = await getRankedCoursesForUser(userId);
  revalidateAppSurfaces(viewer.profile?.handle);

  return {
    ok: true,
    data: rankings
  };
}

export async function saveCourseOrder(courseIds: string[]): Promise<ActionResult<RankedCourse[]>> {
  const viewer = await requireOnboardedViewer("/my-courses");
  const admin = createAdminClient();
  const userId = viewer.user!.id;

  const existing = await getRankedCoursesForUser(userId);
  const existingIds = existing.map((course) => course.id).sort();
  const submittedIds = [...courseIds].sort();

  if (existingIds.join("|") !== submittedIds.join("|")) {
    return {
      ok: false,
      message: "The ranking list drifted out of sync. Refresh and try again."
    };
  }

  const deleteResult = await admin.from("user_rankings").delete().eq("user_id", userId);

  if (deleteResult.error) {
    return {
      ok: false,
      message: deleteResult.error.message
    };
  }

  const insertResult = await admin.from("user_rankings").insert(
    courseIds.map((courseId, index) => ({
      user_id: userId,
      course_id: courseId,
      rank_index: index
    }))
  );

  if (insertResult.error) {
    return {
      ok: false,
      message: insertResult.error.message
    };
  }

  await admin.rpc("rebuild_user_pairwise_signals", {
    target_user_id: userId
  });

  const rankings = await getRankedCoursesForUser(userId);
  revalidateAppSurfaces(viewer.profile?.handle);

  return {
    ok: true,
    data: rankings
  };
}

export async function toggleFollow(targetHandle: string): Promise<ActionResult<{ following: boolean }>> {
  const viewer = await requireOnboardedViewer(`/profile/${targetHandle}`);
  const targetProfile = await getProfileByHandle(targetHandle);

  if (!targetProfile) {
    return {
      ok: false,
      message: "That golfer profile could not be found."
    };
  }

  if (viewer.user!.id === targetProfile.id) {
    return {
      ok: false,
      message: "You already see your own profile from the inside."
    };
  }

  const admin = createAdminClient();
  const following = await getFollowState(viewer.user!.id, targetProfile.id);

  const result = following
    ? await admin
        .from("follows")
        .delete()
        .eq("follower_user_id", viewer.user!.id)
        .eq("followed_user_id", targetProfile.id)
    : await admin.from("follows").insert({
        follower_user_id: viewer.user!.id,
        followed_user_id: targetProfile.id
      });

  if (result.error) {
    return {
      ok: false,
      message: result.error.message
    };
  }

  revalidatePath("/friends");
  revalidatePath(`/profile/${targetProfile.handle}`);
  revalidatePath(`/compare/${targetProfile.handle}`);

  return {
    ok: true,
    data: {
      following: !following
    }
  };
}

export async function submitFeedback(input: {
  feedbackType: string;
  message: string;
  screenName: string;
  currentUrl: string;
  userAgent?: string;
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
  const result = await admin.from("feedback").insert({
    user_id: viewer.user?.id ?? null,
    feedback_type: input.feedbackType,
    screen_name: input.screenName || "Unknown screen",
    current_url: input.currentUrl || "/feedback",
    message: input.message.trim(),
    browser_context: {
      user_agent: input.userAgent ?? "unknown"
    }
  });

  if (result.error) {
    return {
      ok: false,
      message: result.error.message
    };
  }

  revalidatePath("/feedback");

  return {
    ok: true,
    message: "Feedback captured. Thanks for helping shape the next cut."
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
