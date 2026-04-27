import "server-only";

import type { User } from "@supabase/supabase-js";

import {
  creatorProfileFieldNames,
  type CreatorProfileValues,
  type DemoStatus
} from "@/lib/forms";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSupabaseEnv } from "@/lib/supabase/env";
import { createPublicAuthClient } from "@/lib/supabase/server";

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
      emailSent: true;
    }
  | {
      status: "partial";
      account: AccountRecord;
      emailSent: false;
      message: string;
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

  const upsertPayload: Partial<AccountRecord> & { id: string; email: string; role: AccountRole } = {
    id: user.id,
    email,
    role
  };

  if (metadataName) {
    upsertPayload.name = metadataName;
  }

  for (const [key, value] of Object.entries(pickCreatorProfile(profile ?? {}))) {
    upsertPayload[key as keyof CreatorProfileValues] = value;
  }

  const { data, error } = await admin
    .from("accounts")
    .upsert(upsertPayload, {
      onConflict: "id"
    })
    .select("*")
    .single<AccountRecord>();

  if (error || !data) {
    console.error("Creator App Studio account upsert failed", {
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

  if (!env.hasServiceRole || !env.url || !env.publicKey) {
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

  const authClient = createPublicAuthClient();
  const { error: otpError } = await authClient.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${env.siteUrl}/api/auth/callback?next=${encodeURIComponent("/account")}`
    }
  });

  if (otpError) {
    console.error("Creator App Studio account link email failed", {
      code: otpError.code,
      message: otpError.message,
      email,
      accountId: ensured.account.id
    });

    return {
      status: "partial",
      account: ensured.account,
      emailSent: false,
      message:
        "Your idea was received and your account was prepared, but the sign-in email could not be sent just now. We can still follow up manually."
    };
  }

  return {
    status: "success",
    account: ensured.account,
    emailSent: true
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
