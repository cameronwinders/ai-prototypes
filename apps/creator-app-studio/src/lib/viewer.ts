import "server-only";

import { redirect } from "next/navigation";

import { getOrCreateAccountFromUser, type AccountRecord } from "@/lib/account-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ViewerContext = {
  user: {
    id: string;
    email: string | null;
  } | null;
  account: AccountRecord | null;
  isAdmin: boolean;
};

export async function getViewerContext(): Promise<ViewerContext> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      account: null,
      isAdmin: false
    };
  }

  let account: AccountRecord | null = null;

  const { data } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<AccountRecord>();

  account = data ?? null;

  if (!account) {
    const ensured = await getOrCreateAccountFromUser(user);
    account = ensured.account;
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? null
    },
    account,
    isAdmin: account?.role === "admin"
  };
}

export async function requireViewer(nextPath: string) {
  const viewer = await getViewerContext();

  if (!viewer.user) {
    redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  }

  return viewer;
}

export async function requireAdmin(nextPath: string) {
  const viewer = await requireViewer(nextPath);

  if (!viewer.isAdmin) {
    redirect("/account");
  }

  return viewer;
}
