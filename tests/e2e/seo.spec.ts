import { expect, test } from "@playwright/test";

/**
 * SEO content and crawl signals. CI builds as production (VERCEL_ENV=production, www origin), so pages must be
 * indexable and canonicals point at the www origin.
 */
const ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.hasronaldoscoredonyourbirthday.xyz").replace(
  /\/$/,
  "",
);

test.describe("result pages: answer-first content and internal links", () => {
  test("06-23: breadcrumb, answer, career facts, neighbours, month link, trust line", async ({ page }) => {
    await page.goto("/birthday/06-23");

    const crumbs = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(crumbs).toHaveText(/Home\s*\/\s*Calendar\s*\/\s*June\s*\/\s*23 June/);
    await expect(crumbs.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    await expect(crumbs.getByRole("link", { name: "Calendar" })).toHaveAttribute("href", "/calendar");
    await expect(crumbs.getByRole("link", { name: "June" })).toHaveAttribute("href", "/calendar/june");
    await expect(crumbs.getByText("23 June")).toHaveAttribute("aria-current", "page");

    await expect(page.getByTestId("answer")).toHaveText(
      /^Yes\. Cristiano Ronaldo has scored 4 official goals on 23 June/,
    );
    await expect(page.getByRole("heading", { level: 2, name: "Every Ronaldo goal on 23 June" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "23 June in Ronaldo's career" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: /Portugal 2–2 France\s*,\s*2021/ })).toHaveCount(1);

    const nearby = page.getByRole("navigation", { name: "Nearby dates" });
    await expect(nearby.getByRole("link").first()).toHaveAttribute("href", "/birthday/06-22");
    await expect(nearby.getByRole("link").last()).toHaveAttribute("href", "/birthday/06-24");
    await expect(page.getByRole("link", { name: "See all of June →" })).toHaveAttribute("href", "/calendar/june");
    await expect(page.getByRole("link", { name: "How we count →" })).toHaveAttribute("href", "/about#what-counts");
  });

  test("12-31: next date wraps to 1 January", async ({ page }) => {
    await page.goto("/birthday/12-31");
    const nearby = page.getByRole("navigation", { name: "Nearby dates" });
    await expect(nearby.getByRole("link").last()).toHaveAttribute("href", "/birthday/01-01");
  });

  test("02-16: no-goal answer, breadcrumb replaces the back row", async ({ page }) => {
    await page.goto("/birthday/02-16");
    await expect(page.getByTestId("answer")).toHaveText(/^No\. Cristiano Ronaldo has never scored/);
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Home" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Another date/ })).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Nearby dates" })).toBeVisible();
  });
});

test.describe("crawl signals on every route type", () => {
  for (const path of ["/", "/calendar", "/birthday/06-23", "/birthday/02-16", "/about"]) {
    test(`${path}: one h1, canonical = og:url = page URL, JSON-LD parses, indexable`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveCount(1);
      const href = (await canonical.getAttribute("href"))!;
      // Next writes the home canonical without the trailing slash.
      expect(href).toBe(path === "/" ? ORIGIN : `${ORIGIN}${path}`);
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", href);
      const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(blocks.length).toBeGreaterThan(0);
      for (const b of blocks) expect(() => JSON.parse(b)).not.toThrow();
      const robots = await page.locator('meta[name="robots"]').getAttribute("content");
      expect(robots ?? "").not.toMatch(/noindex/);
    });
  }
});
