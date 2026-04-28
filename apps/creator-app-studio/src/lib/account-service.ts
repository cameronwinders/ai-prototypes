import "server-only";

import type { User } from "@supabase/supabase-js";

import {
  creatorProfileFieldNames,
  type CreatorProfileValues,
  type DemoStatus
} from "@/lib/forms";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSupabaseEnv } from "@/lib/supabase/env";

export type AccountRole = "creator" | "admin";

export type AccountRecord = {
  id: string;
  created_at: string;
  updated_at: string;
  email: string;
  name: string | null;
  brand_name: string | null;
  creator_handle: string | null;
  primary_platform: string | null;
  audience_size_range: string | null;
  niche: string | null;
  current_monetization: string | null;
  rough_app_idea: string | null;
  role: AccountRole;
  primary_demo_url: string | null;
  demo_label: string | null;
  demo_status: DemoStatus;
  admin_notes: string | null;
};

export type LeadProvisionResult =
  | {
      status: "success";
      account: AccountRecord;
    }
  | {
      status: "error";
      message: string;
    };

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function pickCreatorProfile(values: Partial<CreatorProfileValues>) {
  const profile: Partial<CreatorProfileValues> = {};

  for (const field of creatorProfileFieldNames) {
    const value = values[field];

    if (typeof value === "string") {
      profile[field] = value;
    }
  }

  return profile;
}

export function accountNeedsDemo(account: Pick<AccountRecord, "primary_demo_url">) {
  return !account.primary_demo_url;
}

export async function getOrCreateAccountFromUser(
  user: Pick<User, "id" | "email" | "user_metadata">,
  profile?: Partial<CreatorProfileValues>
) {
  const env = getServerSupabaseEnv();

  if (!env.hasServiceRole) {
    return {
      account: null,
      message:
        "Account access is not fully configured in this environment yet. Your sign-in worked, but account provisioning needs the service role key."
    } as const;
  }

  const email = normalizeEmail(user.email ?? "");

  if (!email) {
    return {
      account: null,
      message: "We could not determine an email address for this account."
    } as const;
  }

  const admin = createAdminClient();
  const role = await getRoleForEmail(email);
  const metadataName =
    typeof user.user_metadata?.name === "string" ? user.user_metadata.name.trim() : undefined;

  const accountPayload: Partial<AccountRecord> & { id: string; email: string; role: AccountRole } = {
    id: user.id,
    email,
    role
  };

  if (metadataName) {
    accountPayload.name = metadataName;
  }

  for (const [key, value] of Object.entries(pickCreatorProfile(profile ?? {}))) {
    accountPayload[key as keyof CreatorProfileValues] = value;
  }

  const { data: existingAccount, error: existingAccountError } = await admin
    .from("accounts")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<AccountRecord>();

  if (existingAccountError) {
    console.error("Creator App Studio account lookup failed", {
      code: existingAccountError.code,
      message: existingAccountError.message,
      email,
      userId: user.id
    });

    return {
      account: null,
      message: "We could not finish setting up this account yet."
    } as const;
  }

  const accountMutation = existingAccount
    ? admin
        .from("accounts")
        .update({
          email: accountPayload.email,
          role: accountPayload.role,
          name: accountPayload.name ?? existingAccount.name,
          brand_name: accountPayload.brand_name ?? existingAccount.brand_name,
          creator_handle: accountPayload.creator_handle ?? existingAccount.creator_handle,
          primary_platform: accountPayload.primary_platform ?? existingAccount.primary_platform,
          audience_size_range:
            accountPayload.audience_size_range ?? existingAccount.audience_size_range,
          niche: accountPayload.niche ?? existingAccount.niche,
          current_monetization:
            accountPayload.current_monetization ?? existingAccount.current_monetization,
          rough_app_idea: accountPayload.rough_app_idea ?? existingAccount.rough_app_idea
        })
        .eq("id", user.id)
    : admin.from("accounts").insert(accountPayload);

  const { data, error } = await accountMutation.select("*").single<AccountRecord>();

  if (error || !data) {
    console.error("Creator App Studio account write failed", {
      code: error?.code,
      message: error?.message,
      email,
      userId: user.id
    });

    return {
      account: null,
      message: "We could not finish setting up this account yet."
    } as const;
  }

  return {
    account: data,
    message: null
  } as const;
}

export async function provisionLeadAccount(
  values: CreatorProfileValues,
  ctaSource: string
): Promise<LeadProvisionResult> {
  const env = getServerSupabaseEnv();

  if (!env.hasServiceRole) {
    return {
      status: "error",
      message:
        "This preview is not accepting account-backed consult requests yet. The page is live, but the secure account workflow is not configured in this environment."
    };
  }

  const admin = createAdminClient();
  const email = normalizeEmail(values.email);
  const profile = {
    ...values,
    email
  };

  let user = await findAuthUserByEmail(email);

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        name: values.name,
        brand_name: values.brand_name ?? null
      }
    });

    if (error || !data.user) {
      console.error("Creator App Studio auth user creation failed", {
        code: error?.code,
        message: error?.message,
        email
      });

      return {
        status: "error",
        message:
          "We could not create your secure account just now. Please try again in a moment."
      };
    }

    user = data.user;
  }

  const ensured = await getOrCreateAccountFromUser(user, profile);

  if (!ensured.account) {
    return {
      status: "error",
      message: ensured.message
    };
  }

  const { error: leadError } = await admin.from("leads").insert({
    ...profile,
    cta_source: ctaSource,
    account_id: ensured.account.id
  });

  if (leadError) {
    console.error("Creator App Studio lead submission failed", {
      code: leadError.code,
      message: leadError.message,
      email,
      accountId: ensured.account.id
    });

    return {
      status: "error",
      message:
          "We could not save your idea just now. Please try again in a moment. Duplicate submissions are okay."
    };
  }

  return {
    status: "success",
    account: ensured.account
  };
}

async function getRoleForEmail(email: string): Promise<AccountRole> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("admin_allowlist")
    .select("email")
    .eq("email", email)
    .maybeSingle<{ email: string }>();

  if (error) {
    console.error("Creator App Studio admin allowlist lookup failed", {
      code: error.code,
      message: error.message,
      email
    });

    return "creator";
  }

  return data ? "admin" : "creator";
}

async function findAuthUserByEmail(email: string) {
  const admin = createAdminClient();
  let page = 1;

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200
    });

    if (error) {
      console.error("Creator App Studio auth lookup failed", {
        code: error.code,
        message: error.message,
        email
      });

      return null;
    }

    const match = data.users.find((candidate) => normalizeEmail(candidate.email ?? "") === email);

    if (match) {
      return match;
    }

    if (data.users.length < 200) {
      return null;
    }

    page += 1;
  }
}
