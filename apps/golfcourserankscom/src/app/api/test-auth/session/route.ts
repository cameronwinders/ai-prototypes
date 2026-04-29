import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { ensureProfileForUser } from "@/lib/data";
import { HANDICAP_OPTIONS } from "@/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicSupabaseEnv, getSiteUrl } from "@/lib/supabase/env";
import { createRouteSupabaseClient } from "@/lib/supabase/server";

function isHandicapBand(value: string): value is (typeof HANDICAP_OPTIONS)[number] {
  return HANDICAP_OPTIONS.includes(value as (typeof HANDICAP_OPTIONS)[number]);
}

async function ensureUser(email: string) {
  const admin = createAdminClient();
  let page = 1;

  while (true) {
    const listed = await admin.auth.admin.listUsers({
      page,
      perPage: 200
    });

    if (listed.error) {
      throw listed.error;
    }

    const existing = listed.data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());

    if (existing) {
      return existing;
    }

    if (listed.data.users.length < 200) {
      break;
    }

    page += 1;
  }

  const created = await admin.auth.admin.createUser({
    email,
    email_confirm: true
  });

  if (created.error || !created.data.user) {
    throw created.error ?? new Error("Could not create smoke-test user.");
  }

  return created.data.user;
}

export async function POST(request: NextRequest) {
  const smokeSecret = process.env.SMOKE_TEST_SECRET;

  if (!smokeSecret) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        email?: string;
        handicapBand?: string;
        secret?: string;
      }
    | null;
  const providedSecret =
    request.headers.get("x-smoke-test-secret") ??
    request.nextUrl.searchParams.get("secret") ??
    body?.secret ??
    null;
  const isLocalHost = ["127.0.0.1", "localhost"].includes(request.nextUrl.hostname);

  if (!isLocalHost && providedSecret !== smokeSecret) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const email = body?.email?.trim().toLowerCase() ?? "";
  const handicapBand = body?.handicapBand?.trim() ?? "";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  if (!isHandicapBand(handicapBand)) {
    return NextResponse.json({ error: "A valid handicap band is required." }, { status: 400 });
  }

  const publicEnv = getPublicSupabaseEnv();

  if (!publicEnv.url || !publicEnv.publicKey) {
    return NextResponse.json({ error: "Supabase auth is not configured." }, { status: 500 });
  }

  await ensureUser(email);
  const admin = createAdminClient();
  const generated = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${getSiteUrl()}/api/auth/callback?next=%2Fleaderboard`
    }
  });

  if (generated.error || !generated.data.properties?.email_otp) {
    return NextResponse.json(
      { error: generated.error?.message ?? "Could not generate a smoke-test magic link." },
      { status: 500 }
    );
  }

  const publicClient = createClient(publicEnv.url, publicEnv.publicKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const verified = await publicClient.auth.verifyOtp({
    email,
    token: generated.data.properties.email_otp,
    type: "email"
  });

  if (verified.error || !verified.data.session?.access_token || !verified.data.session.refresh_token) {
    return NextResponse.json(
      { error: verified.error?.message ?? "Could not create a smoke-test session." },
      { status: 500 }
    );
  }

  const response = NextResponse.json({ ok: true });
  const routeSupabase = createRouteSupabaseClient(request, response);
  const sessionResult = await routeSupabase.auth.setSession({
    access_token: verified.data.session.access_token,
    refresh_token: verified.data.session.refresh_token
  });

  if (sessionResult.error || !sessionResult.data.user) {
    return NextResponse.json(
      { error: sessionResult.error?.message ?? "Could not attach the smoke-test session." },
      { status: 500 }
    );
  }

  const profile = await ensureProfileForUser(sessionResult.data.user);
  const updated = await admin
    .from("users")
    .update({
      handicap_band: handicapBand,
      onboarding_completed: true,
      email
    })
    .eq("id", profile.id);

  if (updated.error) {
    return NextResponse.json({ error: updated.error.message }, { status: 500 });
  }

  return response;
}
