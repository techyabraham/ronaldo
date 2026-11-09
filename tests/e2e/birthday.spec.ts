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
      /^Ronaldo scored 11 goals on my birthday 🐐 Check yours: https?:\/\/.+\/birthday\/03-10$/,
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
    await expect(page.getByTestId("share-text")).toContainText("Ronaldo never scored on my birthday");
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
