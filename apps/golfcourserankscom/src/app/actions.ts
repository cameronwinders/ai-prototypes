"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  ensureProfileForUser,
  getAllCourses,
  getFriendshipBetweenUsers,
  getPlayedCoursesForUser,
  getProfileByHandle,
  getProfileById,
  getRankedCoursesForUser,
  getWishlistCoursesForUser,
  logAnalyticsEvent,
  searchDiscoverableProfiles,
  upsertProfileSettings
} from "@/lib/data";
import {
  processUnrankedReminderEmails,
  sendAuthMagicLinkEmail,
  sendFriendRequestAcceptedEmail,
  sendFriendRequestReceivedEmail,
  sendInviteConversionEmail
} from "@/lib/email-notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestSiteUrl, getSiteUrl } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  FEEDBACK_TYPES,
  FRIENDSHIP_STATUSES,
  HANDICAP_OPTIONS,
  type FeedbackType,
  type PlayedCourse,
  type ProfileVisibility,
  type RankedCourse,
  type WishlistCourse
} from "@/lib/types";
import { getViewerContext, requireAdminViewer, requireOnboardedViewer, requireViewer } from "@/lib/viewer";

type ActionResult<T> = {
  ok: boolean;
  message?: string;
  data?: T;
};

type AuthMode = "sign-in" | "sign-up";

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

function isMissingWishlistRankColumnError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) {
    return false;
  }

  return (
    error.code === "42703" ||
    error.message?.includes("rank_position") ||
    false
  );
}

function isHandicapBand(value: string): value is (typeof HANDICAP_OPTIONS)[number] {
  return HANDICAP_OPTIONS.includes(value as (typeof HANDICAP_OPTIONS)[number]);
}

function isFeedbackType(value: string): value is FeedbackType {
  return FEEDBACK_TYPES.includes(value as FeedbackType);
}

function isFriendshipStatus(value: string) {
  return FRIENDSHIP_STATUSES.includes(value as (typeof FRIENDSHIP_STATUSES)[number]);
}

function getInviteHandleFromNext(next: string) {
  const normalized = decodeURIComponent(next);
  const match = normalized.match(/\/invite\/([^/?#]+)/i);
  return match?.[1] ?? null;
}

function appPaths(handle?: string | null) {
  return [
    "/",
    "/rankings",
    "/courses",
    "/me/courses",
    "/me/wishlist",
    "/friends",
    "/feedback",
    "/profile",
    "/admin/feedback",
    ...(handle ? [`/u/${handle}`, `/invite/${handle}`] : [])
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
  const next = typeof formData.get("next") === "string" ? String(formData.get("next")) : "/rankings";
  const handicapBandValue = formData.get("handicap_band");

  if (typeof handicapBandValue !== "string" || !isHandicapBand(handicapBandValue)) {
    redirect(`/onboarding?next=${encodeURIComponent(next)}&error=Choose+one+handicap+band`);
  }

  const viewer = await requireViewer("/onboarding");
  const admin = createAdminClient();

  const result = await admin
    .from("users")
    .update({
      handicap_band: handicapBandValue
    })
    .eq("id", viewer.user!.id);

  if (result.error) {
    redirect(`/onboarding?next=${encodeURIComponent(next)}&error=${encodeURIComponent(result.error.message)}`);
  }

  revalidateApp(viewer.profile?.handle);
  redirect(`/onboarding?step=picker&next=${encodeURIComponent(next.startsWith("/") ? next : "/rankings")}`);
}

export async function completeOnboardingCourseSelection(formData: FormData) {
  const next = typeof formData.get("next") === "string" ? String(formData.get("next")) : "/me/courses";
  const selectedCourseIds = formData
    .getAll("course_ids")
    .map((value) => String(value))
    .filter(Boolean);

  const viewer = await requireViewer("/onboarding");

  if (selectedCourseIds.length === 0) {
    redirect(`/onboarding?step=picker&next=${encodeURIComponent(next)}&error=Pick+at+least+one+course`);
  }

  const allCourses = await getAllCourses();
  const validIds = new Set(allCourses.map((course) => course.id));
  const dedupedIds = Array.from(new Set(selectedCourseIds.filter((id) => validIds.has(id))));

  if (dedupedIds.length === 0) {
    redirect(`/onboarding?step=picker&next=${encodeURIComponent(next)}&error=Pick+at+least+one+course`);
  }

  const admin = createAdminClient();
  const insert = await admin.from("played_courses").upsert(
    dedupedIds.map((courseId) => ({
      user_id: viewer.user!.id,
      course_id: courseId
    })),
    {
      onConflict: "user_id,course_id",
      ignoreDuplicates: false
    }
  );

  if (insert.error) {
    redirect(`/onboarding?step=picker&next=${encodeURIComponent(next)}&error=${encodeURIComponent(insert.error.message)}`);
  }

  const inviteHandle = getInviteHandleFromNext(next);

  if (inviteHandle) {
    const deleteRanks = await admin.from("user_course_ranks").delete().eq("user_id", viewer.user!.id);

    if (deleteRanks.error) {
      redirect(`/onboarding?step=picker&next=${encodeURIComponent(next)}&error=${encodeURIComponent(deleteRanks.error.message)}`);
    }

    const insertRanks = await admin.from("user_course_ranks").insert(
      dedupedIds.map((courseId, index) => ({
        user_id: viewer.user!.id,
        course_id: courseId,
        rank_position: index
      }))
    );

    if (insertRanks.error) {
      redirect(`/onboarding?step=picker&next=${encodeURIComponent(next)}&error=${encodeURIComponent(insertRanks.error.message)}`);
    }
  }

  await logAnalyticsEvent({
    userId: viewer.user!.id,
    eventName: "onboarding_grid_completed",
    payload: {
      course_count: dedupedIds.length
    }
  });

  revalidateApp(viewer.profile?.handle);
  redirect(`/onboarding?step=${inviteHandle ? "ranking" : "name"}&next=${encodeURIComponent(next.startsWith("/") ? next : "/me/courses")}`);
}

export async function completeOnboardingRankingStep(formData: FormData) {
  const next = typeof formData.get("next") === "string" ? String(formData.get("next")) : "/rankings";
  const courseIds = formData
    .getAll("course_ids")
    .map((value) => String(value))
    .filter(Boolean);
  const viewer = await requireViewer("/onboarding");
  const admin = createAdminClient();
  const playedCourses = await getPlayedCoursesForUser(viewer.user!.id);
  const playedIds = new Set(playedCourses.map((course) => course.id));

  if (courseIds.length === 0) {
    redirect(`/onboarding?step=ranking&next=${encodeURIComponent(next)}&error=Order+at+least+one+course+to+continue`);
  }

  if (new Set(courseIds).size !== courseIds.length || courseIds.some((courseId) => !playedIds.has(courseId))) {
    redirect(`/onboarding?step=ranking&next=${encodeURIComponent(next)}&error=We+could+not+save+that+ranking.+Please+try+again.`);
  }

  const deleteRanks = await admin.from("user_course_ranks").delete().eq("user_id", viewer.user!.id);

  if (deleteRanks.error) {
    redirect(`/onboarding?step=ranking&next=${encodeURIComponent(next)}&error=${encodeURIComponent(deleteRanks.error.message)}`);
  }

  const insertRanks = await admin.from("user_course_ranks").insert(
    courseIds.map((courseId, index) => ({
      user_id: viewer.user!.id,
      course_id: courseId,
      rank_position: index
    }))
  );

  if (insertRanks.error) {
    redirect(`/onboarding?step=ranking&next=${encodeURIComponent(next)}&error=${encodeURIComponent(insertRanks.error.message)}`);
  }

  await rebuildSignalsForUser(viewer.user!.id);
  revalidateApp(viewer.profile?.handle);
  redirect(`/onboarding?step=name&next=${encodeURIComponent(next.startsWith("/") ? next : "/rankings")}`);
}

export async function completeOnboardingNameStep(formData: FormData) {
  const next = typeof formData.get("next") === "string" ? String(formData.get("next")) : "/rankings";
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const viewer = await requireViewer("/onboarding");
  const admin = createAdminClient();
  const displayName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const updatePayload: {
    onboarding_completed: boolean;
    display_name?: string;
  } = {
    onboarding_completed: true
  };

  if (displayName) {
    updatePayload.display_name = displayName;
  }

  const result = await admin.from("users").update(updatePayload).eq("id", viewer.user!.id);

  if (result.error) {
    redirect(`/onboarding?step=name&next=${encodeURIComponent(next)}&error=${encodeURIComponent(result.error.message)}`);
  }

  await logAnalyticsEvent({
    userId: viewer.user!.id,
    eventName: "signup_completed",
    payload: {
      handicap_band: viewer.profile?.handicap_band ?? null,
      name_provided: Boolean(displayName)
    }
  });

  revalidateApp(viewer.profile?.handle);
  redirect(next.startsWith("/") ? next : "/rankings");
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/sign-in?signed_out=1");
}

export async function updateProfileSettingsAction(formData: FormData) {
  const viewer = await requireOnboardedViewer("/profile");
  const next = typeof formData.get("next") === "string" ? String(formData.get("next")) : "/profile";
  const profileVisibility = String(formData.get("profile_visibility") ?? "public") as ProfileVisibility;
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const displayNameInput = String(formData.get("display_name") ?? "").trim();
  const displayName = [firstName, lastName].filter(Boolean).join(" ").trim() || displayNameInput || null;

  try {
    const updated = await upsertProfileSettings({
      userId: viewer.user!.id,
      displayName,
      handle: String(formData.get("handle") ?? viewer.profile?.handle ?? "golfer"),
      homeState: String(formData.get("home_state") ?? "").trim() || null,
      profileVisibility,
      handicapVisibility: formData.get("handicap_visibility") === "on",
      discoverabilityEnabled: formData.get("discoverability_enabled") === "on"
    });

    revalidateApp(viewer.profile?.handle);
    revalidateApp(updated.handle);
    redirect(next.startsWith("/") ? `${next}?saved=1` : "/profile?saved=1");
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "We could not save your profile settings.";
    redirect(`/profile?error=${encodeURIComponent(message)}`);
  }
}

export async function requestSignInLink(input: {
  email: string;
  next: string;
  mode: AuthMode;
}): Promise<ActionResult<null>> {
  const email = input.email.trim().toLowerCase();
  const next = input.next.startsWith("/") ? input.next : "/rankings";
  const requestSiteUrl = await getRequestSiteUrl();

  if (!email.includes("@")) {
    return {
      ok: false,
      message: "Enter a valid email address."
    };
  }

  const admin = createAdminClient();
  const createUserResult = await admin.auth.admin.createUser({
    email,
    email_confirm: false
  });

  if (
    createUserResult.error &&
    !createUserResult.error.message.includes("already been registered")
  ) {
    return {
      ok: false,
      message: createUserResult.error.message
    };
  }

  const generatedLink = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${requestSiteUrl}/api/auth/callback?next=${encodeURIComponent(next)}`
    }
  });

  if (generatedLink.error) {
    return {
      ok: false,
      message: generatedLink.error.message
    };
  }

  const hashedToken = generatedLink.data.properties?.hashed_token;
  const verificationType = generatedLink.data.properties?.verification_type;

  if (!hashedToken || !verificationType) {
    return {
      ok: false,
      message: "We could not create the sign-in link."
    };
  }

  const actionLink = `${requestSiteUrl}/api/auth/callback?token_hash=${encodeURIComponent(hashedToken)}&type=${encodeURIComponent(verificationType)}&next=${encodeURIComponent(next)}`;

  try {
    await sendAuthMagicLinkEmail({
      to: email,
      subject:
        input.mode === "sign-up"
          ? "Confirm your Golf Course Ranks account"
          : "Your Golf Course Ranks sign-in link",
      actionLink,
      mode: input.mode
    });
  } catch (caught) {
    return {
      ok: false,
      message: caught instanceof Error ? caught.message : "We could not send the sign-in email."
    };
  }

  return {
    ok: true,
    message:
      input.mode === "sign-up"
        ? "Check your email for the account link. Once you open it, it will create your account so you can start ranking."
        : "Check your email for the secure sign-in link."
  };
}

export async function setCoursePlayed(courseId: string, played: boolean): Promise<ActionResult<PlayedCourse[]>> {
  const viewer = await requireOnboardedViewer("/courses");
  const admin = createAdminClient();
  const userId = viewer.user!.id;

  if (played) {
    const [result, wishlistDelete] = await Promise.all([
      admin.from("played_courses").upsert(
        {
          user_id: userId,
          course_id: courseId
        },
        {
          onConflict: "user_id,course_id",
          ignoreDuplicates: false
        }
      ),
      admin.from("wishlist_courses").delete().eq("user_id", userId).eq("course_id", courseId)
    ]);

    if (result.error) {
      return {
        ok: false,
        message: result.error.message
      };
    }

    if (wishlistDelete.error && !isMissingWishlistTableError(wishlistDelete.error)) {
      return {
        ok: false,
        message: wishlistDelete.error.message
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

export async function setCourseWishlisted(
  courseId: string,
  wishlisted: boolean
): Promise<ActionResult<{ wishlisted: boolean }>> {
  const viewer = await requireOnboardedViewer("/courses");
  const admin = createAdminClient();
  const userId = viewer.user!.id;

  if (wishlisted) {
    const existingPlayed = await admin
      .from("played_courses")
      .select("course_id")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (existingPlayed.error) {
      return {
        ok: false,
        message: existingPlayed.error.message
      };
    }

    if (existingPlayed.data) {
      return {
        ok: false,
        message: "Played courses do not need a wish list spot."
      };
    }

    const [existingWishlist, wishlistCount] = await Promise.all([
      admin.from("wishlist_courses").select("course_id, rank_position").eq("user_id", userId).eq("course_id", courseId).maybeSingle(),
      admin.from("wishlist_courses").select("course_id", { count: "exact", head: true }).eq("user_id", userId)
    ]);

    if (
      existingWishlist.error &&
      !isMissingWishlistTableError(existingWishlist.error) &&
      !isMissingWishlistRankColumnError(existingWishlist.error)
    ) {
      return {
        ok: false,
        message: existingWishlist.error.message
      };
    }

    if (
      wishlistCount.error &&
      !isMissingWishlistTableError(wishlistCount.error) &&
      !isMissingWishlistRankColumnError(wishlistCount.error)
    ) {
      return {
        ok: false,
        message: wishlistCount.error.message
      };
    }

    let result = await admin.from("wishlist_courses").upsert(
      {
        user_id: userId,
        course_id: courseId,
        rank_position: existingWishlist.data?.rank_position ?? wishlistCount.count ?? 0
      },
      {
        onConflict: "user_id,course_id",
        ignoreDuplicates: false
      }
    );

    if (result.error && isMissingWishlistRankColumnError(result.error)) {
      result = await admin.from("wishlist_courses").upsert(
        {
          user_id: userId,
          course_id: courseId
        },
        {
          onConflict: "user_id,course_id",
          ignoreDuplicates: false
        }
      );
    }

      if (result.error) {
        if (isMissingWishlistTableError(result.error)) {
          return {
            ok: false,
            message: "Wish lists are not available until the latest database update finishes."
          };
        }
        return {
          ok: false,
          message: result.error.message
      };
    }
  } else {
    const result = await admin.from("wishlist_courses").delete().eq("user_id", userId).eq("course_id", courseId);

    if (result.error) {
      if (isMissingWishlistTableError(result.error)) {
        return {
          ok: true,
          data: { wishlisted: false }
        };
      }
      return {
        ok: false,
        message: result.error.message
      };
    }
  }

  revalidateApp(viewer.profile?.handle);
  return {
    ok: true,
    data: { wishlisted }
  };
}

export async function saveWishlistOrder(courseIds: string[]): Promise<ActionResult<WishlistCourse[]>> {
  const viewer = await requireOnboardedViewer("/me/wishlist");
  const admin = createAdminClient();
  const userId = viewer.user!.id;
  const wishlistCourses = await getWishlistCoursesForUser(userId);
  const wishlistIds = new Set(wishlistCourses.map((course) => course.id));
  const submittedIds = courseIds.filter(Boolean);

  if (new Set(submittedIds).size !== submittedIds.length) {
    return {
      ok: false,
      message: "We found the same course twice in that wish list order. Try again."
    };
  }

  if (submittedIds.length !== wishlistCourses.length || submittedIds.some((courseId) => !wishlistIds.has(courseId))) {
    return {
      ok: false,
      message: "Only courses already on your wish list can be reordered."
    };
  }

  const updates = submittedIds.map((courseId, index) =>
    admin
      .from("wishlist_courses")
      .update({ rank_position: index })
      .eq("user_id", userId)
      .eq("course_id", courseId)
  );

  const results = await Promise.all(updates);
  const firstError = results.find((result) => result.error)?.error;

  if (firstError) {
    if (isMissingWishlistRankColumnError(firstError)) {
      return {
        ok: false,
        message: "Wish-list ranking will turn on as soon as the latest database update finishes."
      };
    }
    return {
      ok: false,
      message: firstError.message
    };
  }

  const updated = await getWishlistCoursesForUser(userId);
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

export async function quickAddCourseToRanking(courseId: string): Promise<ActionResult<PlayedCourse[]>> {
  const viewer = await requireOnboardedViewer("/me/courses");
  const admin = createAdminClient();
  const userId = viewer.user!.id;

  const playResult = await admin.from("played_courses").upsert(
    {
      user_id: userId,
      course_id: courseId
    },
    {
      onConflict: "user_id,course_id",
      ignoreDuplicates: false
    }
  );

  if (playResult.error) {
    return {
      ok: false,
      message: playResult.error.message
    };
  }

  const [existingRank, rankCount] = await Promise.all([
    admin.from("user_course_ranks").select("course_id").eq("user_id", userId).eq("course_id", courseId).maybeSingle(),
    admin.from("user_course_ranks").select("course_id", { count: "exact", head: true }).eq("user_id", userId)
  ]);

  if (existingRank.error) {
    return {
      ok: false,
      message: existingRank.error.message
    };
  }

  if (!existingRank.data) {
    const insertRank = await admin.from("user_course_ranks").insert({
      user_id: userId,
      course_id: courseId,
      rank_position: rankCount.count ?? 0
    });

    if (insertRank.error) {
      return {
        ok: false,
        message: insertRank.error.message
      };
    }
  }

  await rebuildSignalsForUser(userId);
  const played = await getPlayedCoursesForUser(userId);
  revalidateApp(viewer.profile?.handle);

  return {
    ok: true,
    data: played,
    message: "Added to your ranking list."
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
  const playedCourses = await getPlayedCoursesForUser(userId);
  const playedIds = new Set(playedCourses.map((course) => course.id));
  const submittedIds = courseIds.filter(Boolean);

  if (new Set(submittedIds).size !== submittedIds.length) {
    return {
      ok: false,
      message: "We found the same course twice in that ranking. Try again."
    };
  }

  if (submittedIds.some((courseId) => !playedIds.has(courseId))) {
    return {
      ok: false,
      message: "Only played courses can be added to your ranking."
    };
  }

  const deleteResult = await admin.from("user_course_ranks").delete().eq("user_id", userId);

  if (deleteResult.error) {
    return {
      ok: false,
      message: deleteResult.error.message
    };
  }

  if (submittedIds.length > 0) {
    const insertResult = await admin.from("user_course_ranks").insert(
      submittedIds.map((courseId, index) => ({
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

  try {
    await sendFriendRequestReceivedEmail({
      to: cleanedEmail,
      recipientName: target.data.display_name ?? target.data.handle ?? "there",
      requesterName: viewer.profile?.display_name ?? viewer.profile?.handle ?? "A golfer",
      requesterHandle: viewer.profile?.handle ?? "golfer"
    });
  } catch {
    // Best effort: the request itself should still succeed even if email delivery is down.
  }

  revalidateApp(viewer.profile?.handle);
  return {
    ok: true,
    message: "Friend request sent."
  };
}

export async function sendFriendRequestToUser(targetUserId: string): Promise<ActionResult<null>> {
  const viewer = await requireOnboardedViewer("/friends");

  if (targetUserId === viewer.user!.id) {
    return {
      ok: false,
      message: "That is already your account."
    };
  }

  const target = await getProfileById(targetUserId);

  if (!target || !target.discoverability_enabled || target.profile_visibility === "private") {
    return {
      ok: false,
      message: "That golfer is not available to connect right now."
    };
  }

  const existing = await getFriendshipBetweenUsers(viewer.user!.id, targetUserId);

  if (existing) {
    return {
      ok: false,
      message: existing.status === "accepted" ? "You are already connected." : "That request is already pending."
    };
  }

  const admin = createAdminClient();
  const insert = await admin.from("friendships").insert({
    requester_user_id: viewer.user!.id,
    addressee_user_id: targetUserId,
    status: "pending"
  });

  if (insert.error) {
    return {
      ok: false,
      message: insert.error.message
    };
  }

  if (target.email) {
    try {
      await sendFriendRequestReceivedEmail({
        to: target.email,
        recipientName: target.display_name ?? target.handle ?? "there",
        requesterName: viewer.profile?.display_name ?? viewer.profile?.handle ?? "A golfer",
        requesterHandle: viewer.profile?.handle ?? "golfer"
      });
    } catch {
      // Best effort: do not block the connection flow on email delivery.
    }
  }

  revalidateApp(viewer.profile?.handle);
  return {
    ok: true,
    message: `Request sent to ${target.display_name ?? target.handle}.`
  };
}

export async function searchFriendProfilesAction(query: string) {
  const viewer = await requireOnboardedViewer("/friends");
  return searchDiscoverableProfiles(query, viewer.user!.id);
}

export async function acceptInviteFromHandle(handle: string): Promise<ActionResult<{ handle: string }>> {
  const viewer = await requireOnboardedViewer(`/invite/${handle}`);
  const inviter = await getProfileByHandle(handle);

  if (!inviter) {
    return {
      ok: false,
      message: "That invite link is no longer valid."
    };
  }

  if (inviter.id === viewer.user!.id) {
    return {
      ok: true,
      data: { handle: inviter.handle },
      message: "This is your invite link."
    };
  }

  const existing = await getFriendshipBetweenUsers(viewer.user!.id, inviter.id);
  const admin = createAdminClient();
  let acceptedNow = false;

  if (existing?.status === "accepted") {
    return {
      ok: true,
      data: { handle: inviter.handle },
      message: `You are already connected with ${inviter.display_name ?? inviter.handle}.`
    };
  }

  if (existing) {
    const update = await admin
      .from("friendships")
      .update({
        status: "accepted",
        responded_at: new Date().toISOString()
      })
      .eq("id", existing.id);

    if (update.error) {
      return {
        ok: false,
        message: update.error.message
      };
    }
    acceptedNow = true;
  } else {
    const insert = await admin.from("friendships").insert({
      requester_user_id: inviter.id,
      addressee_user_id: viewer.user!.id,
      status: "accepted",
      responded_at: new Date().toISOString()
    });

    if (insert.error) {
      return {
        ok: false,
        message: insert.error.message
      };
    }
    acceptedNow = true;
  }

  await logAnalyticsEvent({
    userId: viewer.user!.id,
    eventName: "invite_completed",
    payload: {
      inviter_handle: inviter.handle
    }
  });

  if (acceptedNow && inviter.email) {
    try {
      await sendInviteConversionEmail({
        to: inviter.email,
        inviterName: inviter.display_name ?? inviter.handle ?? "there",
        inviterUserId: inviter.id,
        inviterHandle: inviter.handle,
        joinerName: viewer.profile?.display_name ?? viewer.profile?.handle ?? "A golfer",
        joinerUserId: viewer.user!.id,
        joinerHandle: viewer.profile?.handle ?? "golfer"
      });
    } catch {
      // Best effort: the connection should still complete even if email delivery is down.
    }
  }

  revalidateApp(viewer.profile?.handle);
  revalidateApp(inviter.handle);
  return {
    ok: true,
    data: { handle: inviter.handle },
    message: `You are now connected with ${inviter.display_name ?? inviter.handle}.`
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

  if (status === "accepted") {
    const requester = await getProfileById(friendship.data.requester_user_id);

    if (requester?.email) {
      try {
        await sendFriendRequestAcceptedEmail({
          to: requester.email,
          requesterName: requester.display_name ?? requester.handle ?? "there",
          accepterName: viewer.profile?.display_name ?? viewer.profile?.handle ?? "A golfer",
          compareUrl: `${getSiteUrl()}/compare/${encodeURIComponent(viewer.profile?.handle ?? viewer.user!.id)}?utm_source=email&utm_medium=lifecycle&utm_campaign=friend_request_accepted`,
          profileUrl: `${getSiteUrl()}/u/${encodeURIComponent(viewer.profile?.handle ?? viewer.user!.id)}?utm_source=email&utm_medium=lifecycle&utm_campaign=friend_request_accepted`,
          friendshipId,
          requesterUserId: requester.id,
          accepterUserId: viewer.user!.id
        });
      } catch {
        // Best effort: accepting the request should still succeed even if email delivery fails.
      }
    }
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
      message: "Choose a feedback topic before you send your note."
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

export async function runUnrankedReminderSweep() {
  return processUnrankedReminderEmails();
}
