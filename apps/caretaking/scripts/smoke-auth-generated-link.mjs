import { createClient } from "@supabase/supabase-js";

import { assert, getExpectedAuthCallbackUrl, printHeading } from "./smoke-playwright-utils.mjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const expectedCallbackUrl = getExpectedAuthCallbackUrl();

async function main() {
  printHeading("Hosted Supabase Generated Link Check");

  assert(supabaseUrl, "Missing NEXT_PUBLIC_SUPABASE_URL.");
  assert(serviceRoleKey, "Missing SUPABASE_SERVICE_ROLE_KEY.");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const email = process.env.SMOKE_TEST_EMAIL ?? `smoke-link-${Date.now()}@example.com`;
  const password = process.env.SMOKE_TEST_PASSWORD ?? "TemporaryPass123!@#";
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: {
      redirectTo: expectedCallbackUrl
    }
  });

  assert(!error, `Supabase generateLink failed: ${error?.message ?? "unknown error"}`);

  const actionLink = data?.properties?.action_link ?? null;
  const redirectTo = data?.properties?.redirect_to ?? null;

  console.log(
    JSON.stringify(
      {
        email,
        expectedCallbackUrl,
        actionLink,
        redirectTo
      },
      null,
      2
    )
  );

  assert(redirectTo === expectedCallbackUrl, `Expected generated redirect_to ${expectedCallbackUrl}, got ${redirectTo ?? "null"}.`);
  assert(
    typeof actionLink === "string" && actionLink.includes(encodeURIComponent(expectedCallbackUrl)),
    "Generated action_link does not include the expected callback URL."
  );

  console.log("Hosted Supabase generated link uses the expected callback URL.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
