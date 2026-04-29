import type { EmailOtpType } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { ensureProfileForUser } from "@/lib/data";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";
import { createRouteSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const env = getPublicSupabaseEnv();
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const accessToken = requestUrl.searchParams.get("access_token");
  const refreshToken = requestUrl.searchParams.get("refresh_token");
  const requestedNext = requestUrl.searchParams.get("next") ?? "/leaderboard";
  const next = requestedNext.startsWith("/") ? requestedNext : "/leaderboard";
  const authError = requestUrl.searchParams.get("error_description");

  if (!env.url || !env.publicKey) {
    return redirectToSignIn(requestUrl, next, "Supabase auth is not configured.");
  }

  if (authError) {
    return redirectToSignIn(requestUrl, next, authError);
  }

  const response = NextResponse.redirect(new URL(next, request.url));
  const supabase = createRouteSupabaseClient(request, response);
  let callbackUser = null;

  try {
    if (accessToken && refreshToken) {
      const { data } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      callbackUser = data.user ?? null;
    } else if (code) {
      const { data } = await supabase.auth.exchangeCodeForSession(code);
      callbackUser = data.user ?? null;
    } else if (tokenHash && type) {
      const { data } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type
      });
      callbackUser = data.user ?? null;
    }
  } catch (caught) {
    return redirectToSignIn(requestUrl, next, caught instanceof Error ? caught.message : "Could not finish signing you in.");
  }

  const user =
    callbackUser ??
    (
      await supabase.auth.getUser()
    ).data.user;

  if (!user) {
    return redirectToSignIn(requestUrl, next, "We could not finish signing you in.");
  }

  const profile = await ensureProfileForUser(user);

  if (!profile.onboarding_completed || !profile.handicap_band) {
    response.headers.set(
      "Location",
      new URL(`/onboarding?next=${encodeURIComponent(next)}`, request.url).toString()
    );
    return response;
  }

  return response;
}

function redirectToSignIn(requestUrl: URL, next: string, error: string) {
  const signInUrl = new URL("/sign-in", requestUrl);
  signInUrl.searchParams.set("error", error);
  signInUrl.searchParams.set("next", next);
  return NextResponse.redirect(signInUrl);
}
