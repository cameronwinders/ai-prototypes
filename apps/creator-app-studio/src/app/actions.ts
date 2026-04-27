 "use server";

import { redirect } from "next/navigation";

import type {
  AccountFormState,
  AdminAccountFormState,
  LeadFormState
} from "@/app/action-state";
import { getOrCreateAccountFromUser, provisionLeadAccount } from "@/lib/account-service";
import {
  mapAdminFieldErrors,
  mapCreatorProfileFieldErrors,
  mapLeadFieldErrors,
  parseAdminAccountForm,
  parseCreatorProfileUpdateForm,
  parseLeadForm,
  type AdminAccountValues,
  type CreatorProfileFieldName,
  type LeadFieldName
} from "@/lib/forms";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function submitLead(
  _previousState: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  const parsed = parseLeadForm(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "A couple details need attention before we can send this through.",
      fieldErrors: mapLeadFieldErrors(parsed.error)
    };
  }

  const result = await provisionLeadAccount(parsed.data, "landing_form");

  if (result.status === "error") {
    return {
      status: "error",
      message: result.message
    };
  }

  if (result.status === "partial") {
    return {
      status: "partial",
      message: result.message
    };
  }

  return {
    status: "success",
    message:
      "Thanks. We have your idea, prepared your account, and sent a secure access link to your email."
  };
}

export async function updateAccountProfile(
  _previousState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      status: "error",
      message: "Please sign in again before updating your profile."
    };
  }

  const parsed = parseCreatorProfileUpdateForm(formData, user.email);

  if (!parsed.success) {
    return {
      status: "error",
      message: "A couple details need attention before we can save this profile.",
      fieldErrors: mapCreatorProfileFieldErrors(parsed.error)
    };
  }

  const ensured = await getOrCreateAccountFromUser(user, parsed.data);

  if (!ensured.account) {
    return {
      status: "error",
      message: ensured.message
    };
  }

  const { error } = await supabase
    .from("accounts")
    .update({
      name: parsed.data.name,
      brand_name: parsed.data.brand_name ?? null,
      creator_handle: parsed.data.creator_handle ?? null,
      primary_platform: parsed.data.primary_platform ?? null,
      audience_size_range: parsed.data.audience_size_range ?? null,
      niche: parsed.data.niche ?? null,
      current_monetization: parsed.data.current_monetization ?? null,
      rough_app_idea: parsed.data.rough_app_idea ?? null
    })
    .eq("id", user.id);

  if (error) {
    console.error("Creator App Studio account update failed", {
      code: error.code,
      message: error.message,
      userId: user.id
    });

    return {
      status: "error",
      message: "We could not save your profile just now. Please try again."
    };
  }

  return {
    status: "success",
    message: "Your creator profile is up to date."
  };
}

export async function updateAdminAccount(
  _previousState: AdminAccountFormState,
  formData: FormData
): Promise<AdminAccountFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "Please sign in again before making admin updates."
    };
  }

  const { data: actor } = await supabase
    .from("accounts")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string }>();

  if (actor?.role !== "admin") {
    return {
      status: "error",
      message: "Only admins can update account access and demo settings."
    };
  }

  const parsed = parseAdminAccountForm(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "A couple admin fields need attention before saving.",
      fieldErrors: mapAdminFieldErrors(parsed.error)
    };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("accounts")
    .update({
      primary_demo_url: parsed.data.primary_demo_url ?? null,
      demo_label: parsed.data.demo_label ?? null,
      demo_status: parsed.data.demo_status,
      admin_notes: parsed.data.admin_notes ?? null
    })
    .eq("id", parsed.data.account_id);

  if (error) {
    console.error("Creator App Studio admin account update failed", {
      code: error.code,
      message: error.message,
      accountId: parsed.data.account_id,
      actorId: user.id
    });

    return {
      status: "error",
      message: "We could not save those admin updates just now."
    };
  }

  return {
    status: "success",
    message: "Admin updates saved."
  };
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/sign-in?signed_out=1");
}
