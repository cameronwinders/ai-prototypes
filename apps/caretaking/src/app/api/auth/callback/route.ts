import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

import { getSupabaseEnv } from "@/lib/supabase/env";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const requestedNext = requestUrl.searchParams.get("next") ?? "/";
  const next = requestedNext.startsWith("/") ? requestedNext : "/";
  const authError = requestUrl.searchParams.get("error_description");
  const { url, anonKey, schema } = getSupabaseEnv();

  if (authError) {
    return redirectToSignIn(requestUrl, next, authError);
  }

  const response = NextResponse.redirect(new URL(next, request.url));

  const supabase = createServerClient(url, anonKey, {
    db: {
      schema
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  try {
    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
    } else if (tokenHash && type) {
      await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type
      });
    }
  } catch (error) {
    return redirectToSignIn(requestUrl, next, getFriendlyCallbackError(error));
  }

  return response;
}

function redirectToSignIn(requestUrl: URL, next: string, error: string) {
  const signInUrl = new URL("/sign-in", requestUrl);
  signInUrl.searchParams.set("error", error);

  if (next !== "/") {
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
