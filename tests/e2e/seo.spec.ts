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

test.describe("month hubs, calendar links, home facts, about data", () => {
  test("/calendar/june: h1, answer, 30 day links, top dates, prev/next month, breadcrumb, tab bar", async ({
    page,
  }) => {
    await page.goto("/calendar/june");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ronaldo goals in June");
    await expect(page.getByTestId("answer")).toHaveText(/^Cristiano Ronaldo has scored \d+ official goals in June/);
    const grid = page.getByRole("list", { name: "June dates" });
    await expect(grid.getByRole("link")).toHaveCount(30);
    await expect(grid.getByRole("link", { name: "23 June, 4 goals" })).toHaveAttribute("href", "/birthday/06-23");
    await expect(page.getByRole("heading", { name: "Top June dates" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Rest days in June" })).toBeVisible();
    const months = page.getByRole("navigation", { name: "Other months" });
    await expect(months.getByRole("link", { name: "← May" })).toHaveAttribute("href", "/calendar/may");
    await expect(months.getByRole("link", { name: "July →" })).toHaveAttribute("href", "/calendar/july");
    const crumbs = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(crumbs).toHaveText(/Home\s*\/\s*Calendar\s*\/\s*June/);
    await expect(crumbs.getByRole("link", { name: "Calendar" })).toHaveAttribute("href", "/calendar");
    const tabs = page.getByRole("navigation", { name: "Main" });
    await expect(tabs.getByRole("link", { name: "Calendar" })).toHaveAttribute("aria-current", "true");
  });

  test("unknown month slugs 404", async ({ request }) => {
    expect((await request.get("/calendar/smarch")).status()).toBe(404);
  });

  test("/calendar: every month heading links to its hub", async ({ page }) => {
    await page.goto("/calendar");
    const headings = page.getByRole("heading", { level: 2 });
    await expect(headings).toHaveCount(12);
    await expect(page.getByRole("heading", { level: 2, name: /June/ }).getByRole("link")).toHaveAttribute(
      "href",
      "/calendar/june",
    );
  });

  test("home: Ronaldo by the numbers and five FAQ items without JS", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Ronaldo by the numbers" })).toBeVisible();
    await expect(page.locator("details > summary")).toHaveCount(5);
    const first = page.locator("details").first();
    await first.locator("summary").click();
    await expect(first).toContainText(/5 February/);
    for (const box of await page.locator("details > summary").all()) {
      expect((await box.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("/about: #what-counts and #data anchors; the goal list downloads as ODbL JSON", async ({ page, request }) => {
    await page.goto("/about");
    await expect(page.locator("#what-counts")).toHaveText("What counts");
    await expect(page.locator("#data")).toHaveText("The data");
    await expect(page.getByRole("link", { name: "Download the goal list (JSON, ODbL)" })).toHaveAttribute(
      "href",
      "/data/goals.json",
    );
    const res = await request.get("/data/goals.json");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/json");
    expect(res.headers()["link"]).toContain("odbl");
    expect(Array.isArray(await res.json())).toBe(true);
  });
});

test.describe("discovery files", () => {
  test("sitemap, video sitemap, robots, llms.txt and the IndexNow key are served", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    const xml = await sitemap.text();
    expect(xml.match(/<url>/g)).toHaveLength(381);
    expect(xml).toContain(`<loc>${ORIGIN}/calendar/june</loc>`);
    expect(xml).not.toContain("<priority>");

    const video = await request.get("/video-sitemap.xml");
    expect(video.status()).toBe(200);
    expect(video.headers()["content-type"]).toContain("xml");
    expect(await video.text()).toContain('xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"');

    expect(await (await request.get("/robots.txt")).text()).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
    expect(await (await request.get("/llms.txt")).text()).toMatch(/^# GOAT Day/);

    const key = "4e29cc1e77e75ad0112c667337177c0a";
    expect((await (await request.get(`/${key}.txt`)).text()).trim()).toBe(key);
  });
});

test.describe("crawl signals on every route type", () => {
  for (const path of ["/", "/calendar", "/calendar/june", "/birthday/06-23", "/birthday/02-16", "/about"]) {
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
