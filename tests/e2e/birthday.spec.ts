import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const byDate = JSON.parse(fs.readFileSync(path.join(__dirname, "../../data/generated/by-date.json"), "utf8")) as Record<
  string,
  string[]
>;
const scoringDays = Object.values(byDate).filter((v) => v.length > 0).length;

test.describe("GOAT Day on a 360px phone", () => {
  test("pick a date, see the Reveal, land on the result, share text is correct", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/did the goat score on your birthday/i);
    await page.getByLabel("DAY", { exact: true }).selectOption("10");
    await page.getByLabel("MONTH", { exact: true }).selectOption("3");
    await page.getByRole("button", { name: /play my birthday/i }).click();
    await expect(page.getByText("SEARCHING THE GOAT ARCHIVE")).toBeVisible();
    await expect(page).toHaveURL(/\/birthday\/03-10$/, { timeout: 2000 });
    await expect(page.getByTestId("headline")).toHaveText(/The GOAT scored 11 goals on your birthday/i);
    await expect(page.getByTestId("share-text")).toHaveText(
      /^The GOAT scored 11 goals on my birthday \(10 March\), including .+ 🐐 Is yours a GOAT Day\? 👇 https?:\/\/.+\/birthday\/03-10$/,
    );
    await expect(page.locator("iframe")).toHaveCount(0);
  });

  test("Reveal: reduced motion skips it, and Skip intro navigates at once", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.getByLabel("DAY", { exact: true }).selectOption("23");
    await page.getByLabel("MONTH", { exact: true }).selectOption("6");
    await page.getByRole("button", { name: /play my birthday/i }).click();
    await expect(page).toHaveURL(/\/birthday\/06-23$/, { timeout: 1500 });
    await expect(page.getByText("SEARCHING THE GOAT ARCHIVE")).toHaveCount(0);

    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await page.getByLabel("DAY", { exact: true }).selectOption("2");
    await page.getByLabel("MONTH", { exact: true }).selectOption("5");
    await page.getByRole("button", { name: /play my birthday/i }).click();
    await page.getByRole("button", { name: "Skip intro" }).click();
    await expect(page).toHaveURL(/\/birthday\/05-02$/, { timeout: 1000 });
  });

  test("invalid day/month combos are disabled", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("MONTH", { exact: true }).selectOption("2");
    await expect(page.getByLabel("DAY", { exact: true }).locator('option[value="30"]')).toBeDisabled();
    await expect(page.getByLabel("DAY", { exact: true }).locator('option[value="29"]')).toBeEnabled();
    await page.getByLabel("MONTH", { exact: true }).selectOption("");
    await page.getByLabel("DAY", { exact: true }).selectOption("31");
    await expect(page.getByLabel("MONTH", { exact: true }).locator('option[value="4"]')).toBeDisabled();
  });

  test("29 February: rest day, leap-year banner, up next, excuse", async ({ page }) => {
    await page.goto("/birthday/02-29");
    await expect(page.getByTestId("headline")).toHaveText(/Even the GOAT takes a day off/);
    await expect(page.getByText(/leap-year legend/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /up next on the goat calendar/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /after/i }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Leap day" })).toBeVisible();
    await expect(page.getByTestId("share-text")).toContainText("Ronaldo has never scored on my birthday (29 February)");
  });

  test("1 January gets its official excuse", async ({ page }) => {
    await page.goto("/birthday/01-01");
    const card = page.locator("section", { has: page.getByText("The official excuse") });
    await expect(card.getByRole("heading", { name: "New Year's Day" })).toBeVisible();
    await expect(card).toContainText("recovery session for the entire planet");
  });

  test("5 February shows the shared-birthday banner", async ({ page }) => {
    await page.goto("/birthday/02-05");
    await expect(page.getByText("You share a birthday with the GOAT")).toBeVisible();
    await expect(page.getByText("He's never scored on his own birthday either.")).toBeVisible();
  });

  test("sharing comes first: the share panel sits above the goals", async ({ page }) => {
    await page.goto("/birthday/05-02");
    const panel = page.locator("#share");
    await expect(panel.getByRole("heading", { name: /show the group chat/i })).toBeVisible();
    const panelTop = (await panel.boundingBox())!.y;
    const firstCardTop = (await page.locator("article").first().boundingBox())!.y;
    expect(panelTop).toBeLessThan(firstCardTop);
    const wa = panel.getByRole("link", { name: /send on whatsapp/i });
    const href = decodeURIComponent((await wa.getAttribute("href"))!);
    expect(href).toContain("https://wa.me/?text=The GOAT scored 12 goals on my birthday (2 May)");
    expect(href).toMatch(/\/birthday\/05-02$/);
    await expect(panel.getByRole("button", { name: /status \/ story/i })).toBeVisible();
    await expect(panel.getByRole("link", { name: /share on x/i })).toBeVisible();
    await expect(panel.getByRole("link", { name: /facebook/i })).toBeVisible();
    await expect(panel.getByRole("link", { name: /telegram/i })).toBeVisible();
    await expect(panel.getByRole("button", { name: /copy link/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /post my goat day/i })).toBeInViewport();
    await expect(page.getByRole("complementary", { name: "Share" })).toHaveCount(2);
  });

  test("SIUUU plays on a goal date, and not with reduced motion", async ({ page, browser }) => {
    await page.goto("/birthday/06-23");
    await expect(page.getByTestId("siuu")).toBeAttached({ timeout: 3000 });
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const p2 = await ctx.newPage();
    await p2.goto(`${test.info().project.use.baseURL}/birthday/06-23`);
    await p2.waitForTimeout(800);
    await expect(p2.getByTestId("siuu")).toHaveCount(0);
    await ctx.close();
  });

  test("episodes fall back to YouTube search while there are no saved videos", async ({ page }) => {
    await page.goto("/birthday/06-23");
    const episodes = page.locator("#episodes article");
    await expect(episodes).toHaveCount(2);
    for (const a of await episodes.all()) {
      await expect(a.getByRole("link", { name: /^Watch .+: \d+ goals? \(opens YouTube\)$/ })).toHaveAttribute(
        "href",
        /youtube\.com\/results/,
      );
    }
    await expect(page.locator("iframe")).toHaveCount(0);
  });

  test("calendar summary uses the live scoring-day count", async ({ page }) => {
    await page.goto("/birthday/06-23");
    await expect(page.getByRole("img", { name: /Goal calendar/ })).toHaveAttribute(
      "aria-label",
      new RegExp(`scored on ${scoringDays} of 366 dates\\. 23 June is one of them\\.`),
    );
  });

  test("home invites the group chat", async ({ page }) => {
    await page.goto("/");
    const wa = page.getByRole("link", { name: /send to group/i });
    await expect(wa).toBeVisible();
    expect(decodeURIComponent((await wa.getAttribute("href"))!)).toContain("Did the GOAT score on your birthday?");
  });

  test("tab bar on browse pages only", async ({ page }) => {
    for (const [p, name] of [
      ["/", "Home"],
      ["/calendar", "Calendar"],
      ["/about", "About"],
    ] as const) {
      await page.goto(p);
      const nav = page.getByRole("navigation", { name: "Main" });
      await expect(nav).toBeVisible();
      await expect(nav.getByRole("link", { name })).toHaveAttribute("aria-current", "page");
    }
    await page.goto("/birthday/06-23");
    await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
  });

  test("/calendar has all 366 dates as links", async ({ page }) => {
    await page.goto("/calendar");
    await expect(page.locator('main a[href^="/birthday/"]')).toHaveCount(366);
    await expect(page.getByRole("link", { name: "23 June, 4 goals" })).toHaveAttribute("href", "/birthday/06-23");
    await expect(page.getByRole("link", { name: "16 February, no goals" })).toBeVisible();
  });

  test("result pages keep SEO titles and OG images; Story image and square redirect", async ({ page, request }) => {
    await page.goto("/birthday/05-02");
    await expect(page).toHaveTitle("Did Ronaldo score on 2 May? Yes — 12 goals");
    const og = await page.locator('meta[property="og:image"]').first().getAttribute("content");
    expect(og).toMatch(/\/birthday\/05-02\/opengraph-image/);
    const story = await request.get("/birthday/06-23/story");
    expect(story.status()).toBe(200);
    expect(story.headers()["content-type"]).toBe("image/png");
    const square = await request.get("/birthday/06-23/square", { maxRedirects: 0 });
    expect(square.status()).toBe(307);
    expect(square.headers()["location"]).toMatch(/\/birthday\/06-23\/story$/);
  });

  test("no horizontal scroll at 360px", async ({ page }) => {
    for (const p of ["/", "/calendar", "/birthday/05-02", "/birthday/06-23", "/birthday/12-25", "/about"]) {
      await page.goto(p);
      // Compare with the device width, not innerWidth: mobile Chrome widens the layout viewport (and innerWidth)
      // to fit overflowing content, which would hide the very bug this test exists to catch.
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - 360);
      expect(overflow, p).toBeLessThanOrEqual(0);
    }
  });

  test("remembers the last searched date", async ({ page }) => {
    await page.goto("/birthday/03-10");
    await page.waitForFunction(() => localStorage.getItem("lastBirthday") === "03-10");
    await page.goto("/");
    await expect(page.getByRole("link", { name: /10 March — check again/ })).toBeVisible();
  });
});
