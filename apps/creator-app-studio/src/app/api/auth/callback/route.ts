import type { EmailOtpType } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getOrCreateAccountFromUser } from "@/lib/account-service";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";
import { createRouteSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const env = getPublicSupabaseEnv();
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const requestedNext = requestUrl.searchParams.get("next") ?? "/account";
  const next = requestedNext.startsWith("/") ? requestedNext : "/account";
  const authError = requestUrl.searchParams.get("error_description");

  if (!env.url || !env.publicKey) {
    return redirectToSignIn(requestUrl, next, "Supabase auth is not configured.");
  }

  if (authError) {
    return redirectToSignIn(requestUrl, next, authError);
  }

  const response = NextResponse.redirect(new URL(next, request.url));
  const supabase = createRouteSupabaseClient(request, response);

  try {
    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
    } else if (tokenHash && type) {
      await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type
      });
    }
  } catch (caught) {
    return redirectToSignIn(requestUrl, next, getFriendlyCallbackError(caught));
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectToSignIn(requestUrl, next, "We could not finish signing you in.");
  }

  const ensured = await getOrCreateAccountFromUser(user);

  if (!ensured.account) {
    return redirectToSignIn(requestUrl, next, ensured.message ?? "We could not open your account.");
  }

  return response;
}

function redirectToSignIn(requestUrl: URL, next: string, error: string) {
  const signInUrl = new URL("/sign-in", requestUrl);
  signInUrl.searchParams.set("error", error);

  if (next !== "/account") {
    signInUrl.searchParams.set("next", next);
  }

  return NextResponse.redirect(signInUrl);
}

function getFriendlyCallbackError(error: unknown) {
  if (error instanceof Error) {
    if (error.message.toLowerCase().includes("expired") || error.message.toLowerCase().includes("invalid")) {
      return "This email link is invalid or has expired. Request a new one to keep going.";
    }

    return error.message;
  }

  return "We could not finish signing you in. Request a new email link and try again.";
}
