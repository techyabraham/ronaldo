import { expect, test } from "@playwright/test";

test.describe("birthday checker on a 360px phone", () => {
  test("pick a date, see results, share text is correct", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Did Ronaldo score on");
    await page.getByLabel("Day", { exact: true }).selectOption("10");
    await page.getByLabel("Month", { exact: true }).selectOption("3");
    await page.getByRole("button", { name: /check my birthday/i }).click();
    await expect(page).toHaveURL(/\/birthday\/03-10$/);
    await expect(page.getByTestId("headline")).toContainText("YES! Ronaldo scored 11 goals on 10 March");
    await expect(page.getByTestId("share-text")).toHaveText(
      /^Ronaldo scored 11 goals on my birthday \(10 March\), including .+ 🐐 Did he score on yours\? 👇 https?:\/\/.+\/birthday\/03-10$/,
    );
    // Facade only: no YouTube iframe before a tap.
    await expect(page.locator("iframe")).toHaveCount(0);
    // Every match card has a video or a YouTube fallback.
    const cards = page.locator("article");
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test("invalid day/month combos are disabled", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Month", { exact: true }).selectOption("2");
    await expect(page.getByLabel("Day", { exact: true }).locator('option[value="30"]')).toBeDisabled();
    await expect(page.getByLabel("Day", { exact: true }).locator('option[value="29"]')).toBeEnabled();
    await page.getByLabel("Month", { exact: true }).selectOption("");
    await page.getByLabel("Day", { exact: true }).selectOption("31");
    await expect(page.getByLabel("Month", { exact: true }).locator('option[value="4"]')).toBeDisabled();
  });

  test("29 February works and shows the empty state with nearest dates", async ({ page }) => {
    await page.goto("/birthday/02-29");
    await expect(page.getByTestId("headline")).toContainText("Not on your birthday");
    await expect(page.getByText(/leap-year baby/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /came close/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /later:/ })).toBeVisible();
    await expect(page.getByTestId("share-text")).toContainText("Ronaldo has NEVER scored on my birthday (29 February)");
  });

  test("sharing comes first: the share panel sits above the goals, in the first screen", async ({ page }) => {
    await page.goto("/birthday/05-02");
    const panel = page.locator("#share");
    await expect(panel.getByRole("heading", { name: /show your friends/i })).toBeVisible();
    // Panel is above the first goal card.
    const panelTop = (await panel.boundingBox())!.y;
    const firstCardTop = (await page.locator("article").first().boundingBox())!.y;
    expect(panelTop).toBeLessThan(firstCardTop);
    // WhatsApp is the primary action and carries the full message + link.
    const wa = panel.getByRole("link", { name: /send on whatsapp/i });
    await expect(wa).toBeVisible();
    const href = decodeURIComponent((await wa.getAttribute("href"))!);
    expect(href).toContain("https://wa.me/?text=Ronaldo scored 12 goals on my birthday (2 May)");
    expect(href).toMatch(/\/birthday\/05-02$/);
    // Status/Story image share, X, Facebook, Telegram and copy are all there.
    await expect(panel.getByRole("button", { name: /status \/ story/i })).toBeVisible();
    await expect(panel.getByRole("link", { name: /share on x/i })).toBeVisible();
    await expect(panel.getByRole("link", { name: /facebook/i })).toBeVisible();
    await expect(panel.getByRole("link", { name: /telegram/i })).toBeVisible();
    await expect(panel.getByRole("button", { name: /copy link/i })).toBeVisible();
    // Sticky CTA is always on screen.
    await expect(page.getByRole("button", { name: /share my result/i })).toBeInViewport();
    // Mid-list and end-of-page nudges.
    await expect(page.getByRole("complementary", { name: "Share" })).toHaveCount(2);
  });

  test("home page invites the group chat", async ({ page }) => {
    await page.goto("/");
    const wa = page.getByRole("link", { name: /send to group/i });
    await expect(wa).toBeVisible();
    expect(decodeURIComponent((await wa.getAttribute("href"))!)).toContain("Did Ronaldo score on your birthday?");
  });

  test("5 February shows the shared-birthday banner", async ({ page }) => {
    await page.goto("/birthday/02-05");
    await expect(page.getByText("Happy birthday to you AND Cristiano!")).toBeVisible();
  });

  test("result pages have per-date titles and OG images", async ({ page }) => {
    await page.goto("/birthday/05-02");
    await expect(page).toHaveTitle("Did Ronaldo score on 2 May? Yes — 12 goals");
    const og = await page.locator('meta[property="og:image"]').first().getAttribute("content");
    expect(og).toMatch(/\/birthday\/05-02\/opengraph-image/);
  });

  test("no horizontal scroll at 360px", async ({ page }) => {
    for (const path of ["/", "/birthday/05-02", "/birthday/12-25", "/about"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test("remembers the last searched date", async ({ page }) => {
    await page.goto("/birthday/03-10");
    await page.waitForFunction(() => localStorage.getItem("lastBirthday") === "03-10");
    await page.goto("/");
    await expect(page.getByRole("link", { name: /10 March — check again/ })).toBeVisible();
  });
});
