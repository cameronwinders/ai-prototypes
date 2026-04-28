import { assert, getExpectedAuthCallbackUrl, getExpectedBaseUrl, loadPlaywright, printHeading } from "./smoke-playwright-utils.mjs";

const expectedCallbackUrl = getExpectedAuthCallbackUrl();
const baseUrl = getExpectedBaseUrl();

async function main() {
  printHeading("Browser Signup Request Check");

  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: process.env.HEADLESS !== "0" });
  const context = await browser.newContext();
  const page = await context.newPage();
  let capturedRequest = null;

  await page.route("**/auth/v1/otp*", async (route) => {
    capturedRequest = {
      url: route.request().url(),
      method: route.request().method(),
      headers: route.request().headers(),
      body: route.request().postDataJSON()
    };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: null,
        session: null
      })
    });
  });

  try {
    await page.goto(`${baseUrl}/sign-in`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Create account" }).click();
    await page.getByLabel("Email").fill(`smoke-${Date.now()}@example.com`);
    await page.getByRole("button", { name: "Send account link" }).click();

    await page.getByText("Check your email for your account link.").waitFor({ timeout: 10_000 });

    assert(capturedRequest, "Expected a signup request to Supabase Auth, but none was captured.");

    const requestUrl = new URL(capturedRequest.url);
    const redirectCandidate =
      requestUrl.searchParams.get("redirect_to") ??
      capturedRequest.body?.emailRedirectTo ??
      capturedRequest.body?.redirectTo ??
      capturedRequest.body?.redirect_to ??
      capturedRequest.body?.options?.emailRedirectTo ??
      capturedRequest.body?.options?.redirectTo ??
      capturedRequest.body?.gotrue_meta_security?.email_redirect_to ??
      null;

    console.log(
      JSON.stringify(
        {
          baseUrl,
          authRequestUrl: capturedRequest.url,
          requestBody: capturedRequest.body,
          extractedRedirectTarget: redirectCandidate
        },
        null,
        2
      )
    );

    assert(
      redirectCandidate === expectedCallbackUrl,
      `Expected auth request redirect target ${expectedCallbackUrl}, got ${redirectCandidate ?? "null"}.`
    );

    console.log("Browser signup request uses the expected app callback URL.");
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
