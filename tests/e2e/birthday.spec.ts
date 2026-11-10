import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const byDate = JSON.parse(fs.readFileSync(path.join(__dirname, "../../data/generated/by-date.json"), "utf8")) as Record<
  string,
  string[]
>;
const scoringDays = Object.values(byDate).filter((v) => v.length > 0).length;
const goalsJson = JSON.parse(fs.readFileSync(path.join(__dirname, "../../data/goals.json"), "utf8"));
const goalList: { id: string | number; matchId: string }[] = Array.isArray(goalsJson) ? goalsJson : goalsJson.goals;
const videos = JSON.parse(fs.readFileSync(path.join(__dirname, "../../data/videos.json"), "utf8")) as Record<
  string,
  { youtubeId?: string; status?: string }
>;
const playable = (matchId: string) => {
  const v = videos[matchId];
  return Boolean(v?.youtubeId && (v.status === "verified" || v.status === "auto"));
};
const matchOf = new Map(goalList.map((g) => [String(g.id), g.matchId]));
/** First date with two playable videos (none until the YouTube matcher has run). */
const twoVideoDate = Object.entries(byDate).find(
  ([, ids]) => [...new Set(ids.map((id) => matchOf.get(String(id))))].filter((m) => m && playable(m)).length >= 2,
)?.[0];
const matchesOn = (mmdd: string) => [...new Set(byDate[mmdd].map((id) => matchOf.get(String(id))))];
/** First date with two or more matches and no saved video, so every episode uses the search fallback. */
const noVideoDate = Object.keys(byDate).find((d) => {
  const ms = matchesOn(d);
  return ms.length >= 2 && ms.every((m) => !m || !playable(m));
});
const CREDIT_X = "Created by @AkinwumiX";
const CREDIT_LINK = "Made by Abraham Akinwumi: https://x.com/AkinwumiX";

test.describe("GOAT Day on a 360px phone", () => {
  test("pick a date, see the Reveal, land on the result, share text is correct", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/has ronaldo scored on your birthday/i);
    await page.getByLabel("DAY", { exact: true }).selectOption("10");
    await page.getByLabel("MONTH", { exact: true }).selectOption("3");
    await page.getByRole("button", { name: /play my birthday/i }).click();
    await expect(page.getByText(/SEARCHING RONALDO'S \d+ GOALS/)).toBeVisible();
    await expect(page).toHaveURL(/\/birthday\/03-10$/, { timeout: 2000 });
    await expect(page.getByTestId("headline")).toHaveText(/Yes! Ronaldo scored 11 goals on your birthday/i);
    const share = (await page.getByTestId("share-text").textContent())!;
    expect(share).toMatch(
      /^Ronaldo scored 11 goals on my birthday \(10 March\), including .+ 🐐 Has he scored on yours\? 👇\nhttps?:\/\/.+\/birthday\/03-10\n\n/,
    );
    expect(share.endsWith(CREDIT_LINK)).toBe(true);
    await expect(page.locator("iframe")).toHaveCount(0);
  });

  test("Reveal: reduced motion skips it, and Skip intro navigates at once", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.getByLabel("DAY", { exact: true }).selectOption("23");
    await page.getByLabel("MONTH", { exact: true }).selectOption("6");
    await page.getByRole("button", { name: /play my birthday/i }).click();
    await expect(page).toHaveURL(/\/birthday\/06-23$/, { timeout: 1500 });
    await expect(page.getByText(/SEARCHING RONALDO'S/)).toHaveCount(0);

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

  test("29 February: rest day, leap-year banner, nearest goals, excuse", async ({ page }) => {
    await page.goto("/birthday/02-29");
    await expect(page.getByTestId("headline")).toHaveText(/Ronaldo has never scored on your birthday/);
    await expect(page.getByText(/Even the GOAT takes a day off, and he chose yours/)).toBeVisible();
    await expect(page.getByText(/leap-year legend/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /So close: Ronaldo's nearest goals/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /after/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /^Watch Ronaldo vs .+, \d{4} on YouTube$/ }).first()).toHaveAttribute(
      "href",
      /youtube\.com\/results/,
    );
    await expect(page.getByRole("heading", { name: "Your birthday on Ronaldo's calendar" })).toBeVisible();
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
    await expect(page.getByText("You share a birthday with Cristiano Ronaldo (5 February 1985).")).toBeVisible();
    await expect(page.getByText("He's never scored on his own birthday either.")).toBeVisible();
  });

  test("watch and share are balanced on the first screen", async ({ page }) => {
    await page.goto("/birthday/05-02");
    await expect(page.getByRole("link", { name: "Watch the goals" }).first()).toBeInViewport();
    // The quick-share row (the sticky bar has no X button, so this is the in-page row).
    await expect(page.getByRole("link", { name: "Share on X" }).first()).toBeInViewport();

    // The goals come before the long share panel.
    const firstEpisodeTop = (await page.locator("#episodes article").first().boundingBox())!.y;
    const panelTop = (await page.locator("#share").boundingBox())!.y;
    expect(firstEpisodeTop).toBeLessThan(panelTop);
    await expect(page.getByRole("complementary", { name: "Share" })).toHaveCount(0);

    // Sticky bar: Watch + Share + WhatsApp.
    const bar = page.getByRole("region", { name: "Watch and share" });
    await expect(bar.getByText("Watch", { exact: true })).toBeVisible();
    const wa = bar.getByRole("link", { name: /whatsapp/i });
    const waText = decodeURIComponent((await wa.getAttribute("href"))!);
    expect(waText).toContain("https://wa.me/?text=Ronaldo scored 12 goals on my birthday (2 May)");
    expect(waText.endsWith(CREDIT_LINK)).toBe(true);

    // The share sheet.
    await bar.getByRole("button", { name: /^share$/i }).click();
    const sheet = page.getByRole("dialog", { name: "Share your result" });
    await expect(sheet).toBeVisible();
    for (const name of ["WhatsApp", "X", "Facebook", "Telegram", "Threads"]) {
      await expect(sheet.getByRole("link", { name, exact: true })).toBeVisible();
    }
    await expect(sheet.getByRole("button", { name: "Story" })).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Copy" })).toBeVisible();
    const x = new URL((await sheet.getByRole("link", { name: "X", exact: true }).getAttribute("href"))!);
    expect(x.searchParams.get("text")!.endsWith(`\n\n${CREDIT_X}`)).toBe(true);
    await sheet.getByRole("button", { name: "Close" }).click();
    await expect(sheet).toBeHidden();
  });

  test("each goal can be shared on its own", async ({ page }) => {
    await page.goto("/birthday/06-23");
    const first = page.locator("#episodes article").first();
    await expect(first).toHaveAttribute("id", /^m-/);
    await first.getByRole("button", { name: /share this goal/i }).click();
    const sheet = page.getByRole("dialog", { name: "Share this goal" });
    await expect(sheet).toBeVisible();
    const wa = decodeURIComponent(
      (await sheet.getByRole("link", { name: "WhatsApp", exact: true }).getAttribute("href"))!,
    );
    expect(wa).toMatch(/Watch Ronaldo's .+ He did it on my birthday/);
    expect(wa).toMatch(/\/birthday\/06-23#m-/);
  });

  test("player: one video at a time, and the sticky bar steps aside", async ({ page }) => {
    test.skip(!twoVideoDate, "no date has two saved videos yet (run npm run data:videos)");
    await page.goto(`/birthday/${twoVideoDate}`);
    await page.locator("[data-play]").nth(0).click();
    await expect(page.locator("iframe")).toHaveCount(1);
    await expect(page.locator('[role="region"][aria-label="Watch and share"]')).toHaveAttribute("aria-hidden", "true");
    // Starting another video unloads the first.
    await page.locator("[data-play]").first().click();
    await expect(page.locator("iframe")).toHaveCount(1);
    await page.getByRole("button", { name: "Close", exact: true }).first().click();
    await expect(page.locator("iframe")).toHaveCount(0);
  });

  test("footer credits the creator; metadata and JSON-LD carry it too", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: "Abraham Akinwumi" })).toHaveAttribute(
      "href",
      "https://abraham.com.ng",
    );
    await expect(footer.getByRole("link", { name: "@AkinwumiX" })).toHaveAttribute("href", "https://x.com/AkinwumiX");
    await expect(footer.getByRole("link", { name: "Calendar" })).toHaveAttribute("href", "/calendar");
    for (const p of ["/", "/birthday/06-23"]) {
      await page.goto(p);
      await expect(page.locator('meta[name="twitter:creator"]')).toHaveAttribute("content", "@AkinwumiX");
    }
    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
    expect(ld["@type"]).toBe("WebSite");
    expect(ld.creator.name).toBe("Abraham Akinwumi");
    await page.goto("/about");
    await expect(page.getByRole("heading", { name: "Who made this" })).toBeVisible();
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

  test("episodes without a saved video fall back to YouTube search", async ({ page }) => {
    test.skip(!noVideoDate, "every scoring date has a saved video");
    await page.goto(`/birthday/${noVideoDate}`);
    const episodes = page.locator("#episodes article");
    await expect(episodes).toHaveCount(matchesOn(noVideoDate!).length);
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
    expect(decodeURIComponent((await wa.getAttribute("href"))!)).toContain("Has Ronaldo scored on your birthday?");
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
    await expect(page).toHaveTitle("Did Ronaldo score on 2 May? Yes, 12 goals (2010–2022)");
    const og = await page.locator('meta[property="og:image"]').first().getAttribute("content");
    expect(og).toMatch(/\/birthday\/05-02\/opengraph-image\/card/);
    await expect(page.locator('meta[property="og:image:alt"]').first()).toHaveAttribute(
      "content",
      "Ronaldo scored 12 goals on 2 May",
    );
    const oldOg = await request.get("/birthday/05-02/opengraph-image", { maxRedirects: 0 });
    expect(oldOg.status()).toBe(308);
    expect(oldOg.headers()["location"]).toMatch(/\/birthday\/05-02\/opengraph-image\/card$/);
    const story = await request.get("/birthday/06-23/story");
    expect(story.status()).toBe(200);
    expect(story.headers()["content-type"]).toBe("image/png");
    const square = await request.get("/birthday/06-23/square", { maxRedirects: 0 });
    expect(square.status()).toBe(307);
    expect(square.headers()["location"]).toMatch(/\/birthday\/06-23\/story$/);
  });

  test("no horizontal scroll at 360px", async ({ page }) => {
    for (const p of [
      "/",
      "/calendar",
      "/birthday/05-02",
      "/birthday/06-23",
      "/birthday/12-25",
      "/birthday/02-29",
      "/about",
    ]) {
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
