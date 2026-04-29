import { createRequire } from "node:module";
import { createClient } from "@supabase/supabase-js";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/cwind/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const schema = process.env.APP_DB_SCHEMA ?? "app_golfcourserankscom_";
const testEmail = process.env.TEST_USER_EMAIL;
const friendEmail = process.env.TEST_FRIEND_EMAIL;
const smokeSecret = process.env.SMOKE_TEST_SECRET;

if (!supabaseUrl || !publishableKey || !serviceRoleKey || !testEmail || !friendEmail || !smokeSecret) {
  console.error("Missing Supabase env, smoke secret, or test email env for smoke script.");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema }
});
const courseIdCache = new Map();

async function ensureUser(email) {
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw error;
    }

    const existing = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (existing) {
      return existing;
    }

    if (data.users.length < 200) {
      break;
    }

    page += 1;
  }

  const created = await admin.auth.admin.createUser({
    email,
    email_confirm: true
  });

  if (created.error) {
    throw created.error;
  }

  return created.data.user;
}

async function resetUserState(email) {
  const authUser = await ensureUser(email);
  const userId = authUser.id;

  const operations = await Promise.all([
    admin.from("feedback").delete().eq("user_id", userId),
    admin.from("pairwise_signals").delete().eq("user_id", userId),
    admin.from("user_course_ranks").delete().eq("user_id", userId),
    admin.from("played_courses").delete().eq("user_id", userId),
    admin.from("friendships").delete().eq("requester_user_id", userId),
    admin.from("friendships").delete().eq("addressee_user_id", userId)
  ]);

  for (const operation of operations) {
    if (operation.error) {
      throw operation.error;
    }
  }
}

async function waitForApp(page) {
  await page.goto(siteUrl, { waitUntil: "domcontentloaded" });
}

async function getCourseIdByName(courseName) {
  if (courseIdCache.has(courseName)) {
    return courseIdCache.get(courseName);
  }

  const course = await admin.from("courses").select("id").eq("name", courseName).single();
  if (course.error || !course.data?.id) {
    throw course.error ?? new Error(`Could not find course ID for ${courseName}`);
  }

  courseIdCache.set(courseName, course.data.id);
  return course.data.id;
}

async function completeProfileByEmail(email, band) {
  const authUser = await ensureUser(email);
  const update = await admin
    .from("users")
    .upsert({
      id: authUser.id,
      email,
      handle: email.split("@")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 28),
      display_name: email.split("@")[0],
      handicap_band: band,
      onboarding_completed: true
    });

  if (update.error) {
    throw update.error;
  }
}

async function completeOnboardingIfNeeded(page, band) {
  if (page.url().includes("/onboarding")) {
    await page.locator(`input[name="handicap_band"][value="${band}"]`).check({ force: true });
    await page.getByRole("button", { name: /Save and enter leaderboard/i }).click();
    await page.waitForURL(/\/(leaderboard|courses)/, { timeout: 20000 });
  }
}

async function loginWithMagicLink(context, page, email, nextPath, band) {
  await ensureUser(email);
  const response = await context.request.post(`${siteUrl}/api/test-auth/session`, {
    headers: {
      "x-smoke-test-secret": smokeSecret
    },
    data: {
      email,
      handicapBand: band,
      secret: smokeSecret
    }
  });

  if (!response.ok()) {
    throw new Error(`Smoke auth bootstrap failed for ${email}: ${await response.text()}`);
  }

  await page.goto(`${siteUrl}${nextPath}`, { waitUntil: "domcontentloaded" });
  if (!page.url().includes(nextPath)) {
    await page.goto(`${siteUrl}${nextPath}`, { waitUntil: "domcontentloaded" });
  }
}

async function markPlayed(page, search, courseName) {
  await page.goto(`${siteUrl}/courses`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("courses-search").fill(search);
  await page.waitForTimeout(300);
  const courseId = await getCourseIdByName(courseName);
  await page.goto(`${siteUrl}/courses/${courseId}`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("course-detail-play-toggle").click();
  await page.getByTestId("course-detail-play-toggle").getByText(/Marked played/i).waitFor();
}

async function addRanked(page, courseName) {
  const courseId = await getCourseIdByName(courseName);
  await page.getByRole("button", { name: /Needs ranking/i }).click();
  const addButton = page.getByTestId(`add-to-ranking-${courseId}`);
  await addButton.waitFor();
  await addButton.click({ force: true });
}

async function getRankedOrder(page) {
  return page.locator('[draggable="true"] h3').evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim() ?? ""));
}

async function run() {
  await resetUserState(testEmail);
  await resetUserState(friendEmail);

  const browser = await chromium.launch({ headless: true });
  const userContext = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const userPage = await userContext.newPage();
  await waitForApp(userPage);
  await loginWithMagicLink(userContext, userPage, testEmail, "/courses", "6-10");

  if (!userPage.url().includes("/courses")) {
    throw new Error(`Expected post-auth redirect back to /courses but landed on ${userPage.url()}`);
  }

  await markPlayed(userPage, "Pebble", "Pebble Beach Golf Links");
  await markPlayed(userPage, "Pacific", "Pacific Dunes");
  await markPlayed(userPage, "Pinehurst", "Pinehurst No 2");

  await userPage.goto(`${siteUrl}/me/courses`, { waitUntil: "networkidle" });
  await addRanked(userPage, "Pebble Beach Golf Links");
  await addRanked(userPage, "Pacific Dunes");
  await addRanked(userPage, "Pinehurst No 2");
  await userPage.getByRole("button", { name: /^Ranked$/i }).click();
  await userPage.locator('[draggable="true"]').filter({ hasText: "Pebble Beach Golf Links" }).first().dragTo(
    userPage.locator('[draggable="true"]').filter({ hasText: "Pinehurst No 2" }).first()
  );
  await userPage.waitForTimeout(1500);
  const savedOrder = await getRankedOrder(userPage);
  await userPage.reload({ waitUntil: "networkidle" });
  const refreshedOrder = await getRankedOrder(userPage);
  if (JSON.stringify(savedOrder) !== JSON.stringify(refreshedOrder)) {
    throw new Error(`Rank order did not persist after refresh. Before: ${savedOrder.join(" | ")} After: ${refreshedOrder.join(" | ")}`);
  }

  await userPage.goto(`${siteUrl}/leaderboard?band=6-10&minSignals=0`, { waitUntil: "networkidle" });
  await userPage.getByText(/Early read/i).first().waitFor();

  await userPage.goto(`${siteUrl}/courses/${await getCourseIdByName("Pebble Beach Golf Links")}`, {
    waitUntil: "networkidle"
  });
  await userPage.getByPlaceholder(/Fast greens/i).fill("Amazing setting and still worth the splurge.");
  await userPage.getByRole("button", { name: /Save note/i }).click();
  await userPage.waitForTimeout(1200);
  await userPage.reload({ waitUntil: "networkidle" });
  const savedNote = await userPage.getByPlaceholder(/Fast greens/i).inputValue();
  if (savedNote !== "Amazing setting and still worth the splurge.") {
    throw new Error(`Expected saved note to persist, but found: ${savedNote}`);
  }

  await userPage.getByRole("link", { name: /Feedback/i }).first().click();
  await userPage.getByRole("button", { name: /^bug$/i }).click();
  await userPage.locator("textarea").fill("Smoke test feedback from the leaderboard-first flow.");
  await userPage.getByRole("button", { name: /Send feedback/i }).click();
  await userPage.getByText(/Feedback captured/i).waitFor();

  await userPage.goto(`${siteUrl}/admin/feedback`, { waitUntil: "networkidle" });
  await userPage.getByText(/Smoke test feedback from the leaderboard-first flow./i).first().waitFor();

  const friendContext = await browser.newContext({ viewport: { width: 1365, height: 960 } });
  const friendPage = await friendContext.newPage();
  await loginWithMagicLink(friendContext, friendPage, friendEmail, "/leaderboard", "11-18");
  await markPlayed(friendPage, "Pebble", "Pebble Beach Golf Links");
  await markPlayed(friendPage, "Pacific", "Pacific Dunes");
  await markPlayed(friendPage, "Pinehurst", "Pinehurst No 2");
  await friendPage.goto(`${siteUrl}/me/courses`, { waitUntil: "networkidle" });
  await addRanked(friendPage, "Pinehurst No 2");
  await addRanked(friendPage, "Pebble Beach Golf Links");
  await addRanked(friendPage, "Pacific Dunes");
  await friendPage.getByRole("button", { name: /^Ranked$/i }).click();
  await friendPage.getByRole("button", { name: /^Up$/i }).nth(1).click();
  await friendPage.waitForTimeout(1000);

  await userPage.goto(`${siteUrl}/friends`, { waitUntil: "networkidle" });
  await userPage.getByPlaceholder(/friend@email.com/i).fill(friendEmail);
  await userPage.getByRole("button", { name: /Send request/i }).click();
  await userPage.getByText(/Friend request sent/i).waitFor();

  await friendPage.goto(`${siteUrl}/friends`, { waitUntil: "networkidle" });
  await friendPage.getByRole("button", { name: /Accept request/i }).click();
  await friendPage.getByText(/Friend request accepted/i).waitFor();
  await friendPage.goto(`${siteUrl}/admin/feedback`, { waitUntil: "networkidle" });
  if (!friendPage.url().includes("/leaderboard")) {
    throw new Error("Non-admin user should not remain on /admin/feedback");
  }

  await userPage.goto(`${siteUrl}/friends`, { waitUntil: "networkidle" });
  await userPage.getByRole("link", { name: /Compare/i }).first().click();
  await userPage.getByText(/Same courses, different order/i).waitFor();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  await loginWithMagicLink(mobileContext, mobilePage, testEmail, "/leaderboard", "6-10");
  await mobilePage.goto(`${siteUrl}/leaderboard`, { waitUntil: "networkidle" });
  await mobilePage.locator("nav").last().getByRole("link", { name: /^Board$/i }).waitFor();
  await mobilePage.goto(`${siteUrl}/me/courses`, { waitUntil: "networkidle" });
  await mobilePage.getByText(/Drag to reorder/i).waitFor();

  await browser.close();
  console.log("Playwright smoke passed.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
