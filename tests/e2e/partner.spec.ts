import { type Page, expect, test } from "@playwright/test";
import { partnerHref } from "../../lib/partner";

/** Banner checks run against the normal build; the "@partner-off" test only in the off-switch project. */
const OFF_PROJECT = "partner-off";
const PAGES = ["/", "/calendar", "/calendar/june", "/about", "/birthday/06-23", "/birthday/02-16", "/nope"];

const top = async (page: Page, selector: string) => (await page.locator(selector).first().boundingBox())!.y;

test.describe("SkillsAir banners", () => {
  test.beforeEach(async ({ context }) => {
    test.skip(test.info().project.name === OFF_PROJECT, "banner checks need the default (on) build");
    // Never hit the real sponsor site from tests.
    await context.route("https://skillsair.com/**", (r) => r.fulfill({ status: 200, body: "SkillsAir stub" }));
  });

  test("/: one home banner between the hero and the picker, labelled and tagged", async ({ page }) => {
    await page.goto("/");
    const banner = page.locator('[data-partner="home"]');
    await expect(banner).toHaveCount(1);
    await expect(page.locator("[data-partner]")).toHaveCount(1);
    const heroBottom = await page
      .locator("section", { has: page.getByRole("heading", { level: 1 }) })
      .evaluate((el) => el.getBoundingClientRect().bottom + window.scrollY);
    const bannerTop = await top(page, '[data-partner="home"]');
    expect(bannerTop).toBeGreaterThanOrEqual(heroBottom);
    expect(bannerTop).toBeLessThan(await top(page, "#pick"));
    await expect(banner).toHaveAttribute("href", partnerHref("home"));
    await expect(banner).toHaveAttribute("rel", /\bsponsored\b/);
    await expect(banner).toHaveAttribute("target", "_blank");
    await expect(banner).toHaveAttribute("data-nosnippet", "");
    await expect(banner).toContainText("SPONSORED");
  });

  test("Reveal: strip above Skip intro opens SkillsAir in a new tab; the result still loads", async ({
    page,
    context,
  }) => {
    // Play the Reveal at 1/5 speed (its clock, frames and backstop timer together) so the strip can be measured
    // and clicked before it ends, however loaded the test machine is. The on-time 1.2s navigation itself is
    // covered by the Reveal tests in birthday.spec.ts.
    await page.addInitScript((f) => {
      const now = performance.now.bind(performance);
      const t0 = now();
      const slow = (t: number) => t0 + (t - t0) / f;
      performance.now = () => slow(now());
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (cb) => raf((t) => cb(slow(t)));
      const st = window.setTimeout.bind(window);
      window.setTimeout = ((fn: TimerHandler, ms?: number, ...a: unknown[]) =>
        st(fn, ms && ms >= 1000 ? ms * f : ms, ...a)) as typeof window.setTimeout;
    }, 5);
    await page.goto("/");
    await page.getByLabel("DAY", { exact: true }).selectOption("10");
    await page.getByLabel("MONTH", { exact: true }).selectOption("3");
    await page.getByRole("button", { name: /play my birthday/i }).click();
    const strip = page.locator('[data-partner="loading"]');
    await expect(strip).toBeVisible();
    const stripBox = (await strip.boundingBox())!;
    const skipTop = (await page.getByRole("button", { name: "Skip intro" }).boundingBox())!.y;
    expect(stripBox.y + stripBox.height).toBeLessThanOrEqual(skipTop);

    const [popup] = await Promise.all([context.waitForEvent("page"), strip.click()]);
    await popup.waitForURL(/^https:\/\/skillsair\.com\//);
    expect(popup.url().startsWith("https://skillsair.com/?skr=WH22F793")).toBe(true);
    // The original tab still finishes the Reveal and lands on the result.
    await expect(page).toHaveURL(/\/birthday\/03-10$/, { timeout: 15_000 });
  });

  test("/birthday/06-23: the card sits between the hero and the quick-share row", async ({ page }) => {
    await page.goto("/birthday/06-23");
    await expect(page.locator("[data-partner]")).toHaveCount(1);
    const heroTop = await top(page, 'a[aria-label="Back to home"]');
    const cardTop = await top(page, '[data-partner="result-yes"]');
    expect(cardTop).toBeGreaterThan(heroTop);
    expect(cardTop).toBeLessThan(await top(page, "#quick-share"));
  });

  test("/birthday/02-16: the card sits after the rest-day header, before the quick-share row", async ({ page }) => {
    await page.goto("/birthday/02-16");
    await expect(page.locator("[data-partner]")).toHaveCount(1);
    const headerBottom = await page
      .locator("header", { has: page.getByTestId("headline") })
      .evaluate((el) => el.getBoundingClientRect().bottom + window.scrollY);
    const cardTop = await top(page, '[data-partner="result-no"]');
    expect(cardTop).toBeGreaterThanOrEqual(headerBottom);
    expect(cardTop).toBeLessThan(await top(page, "#quick-share"));
  });

  test("/calendar: a banner before January, strips after Feb/Apr/Jun/Aug/Oct, none after December", async ({
    page,
  }) => {
    await page.goto("/calendar");
    const partners = page.locator("[data-partner]");
    await expect(partners).toHaveCount(6);
    const ys = await partners.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top + window.scrollY));
    const month = async (m: number) => top(page, `#m-${m}`);
    expect(ys[0]).toBeLessThan(await month(1));
    for (const [i, m] of [2, 4, 6, 8, 10].entries()) {
      expect(ys[i + 1]).toBeGreaterThan(await month(m));
      expect(ys[i + 1]).toBeLessThan(await month(m + 1));
    }
    expect(Math.max(...ys)).toBeLessThan(await month(12));
    const slots = await partners.evaluateAll((els) =>
      els.map((el) => new URL((el as HTMLAnchorElement).href).searchParams.get("utm_content")),
    );
    expect(slots).toEqual(["1", "2", "3", "4", "5", "6"]);
    await expect(partners.first()).toHaveAttribute("href", partnerHref("calendar", 1));
  });

  test("/about: banner right before 'What counts', without the article's red underlined link style", async ({
    page,
  }) => {
    await page.goto("/about");
    const banner = page.locator('[data-partner="about"]');
    await expect(banner).toHaveCount(1);
    const before = await page
      .locator("#what-counts")
      .evaluate((h) => h.previousElementSibling?.querySelector("[data-partner]")?.getAttribute("data-partner"));
    expect(before).toBe("about");
    const style = await banner.evaluate((a) => {
      const s = getComputedStyle(a);
      return { color: s.color, decoration: s.textDecorationLine };
    });
    expect(style.color).not.toBe("rgb(255, 77, 87)"); // --red-text
    expect(style.decoration).toBe("none");
  });

  test("404: one strip below the Check a birthday button", async ({ page }) => {
    await page.goto("/nope");
    await expect(page.locator("[data-partner]")).toHaveCount(1);
    const ctaTop = await top(page, 'main a[href="/"]');
    expect(await top(page, '[data-partner="not-found"]')).toBeGreaterThan(ctaTop);
  });

  for (const width of [320, 360]) {
    test(`no horizontal scroll or clipped banner at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 740 });
      for (const p of ["/", "/calendar", "/about", "/birthday/06-23", "/birthday/02-16"]) {
        await page.goto(p);
        await page.evaluate(() => document.fonts.ready);
        const overflow = await page.evaluate((w) => document.documentElement.scrollWidth - w, width);
        expect(overflow, p).toBeLessThanOrEqual(0);
        const clipped = await page
          .locator("[data-partner]")
          .evaluateAll((els) => els.filter((el) => el.scrollWidth > el.clientWidth).length);
        expect(clipped, p).toBe(0);
      }
    });
  }
});

test("@partner-off: NEXT_PUBLIC_PARTNER=off removes every banner", async ({ page }) => {
  test.skip(
    test.info().project.name !== OFF_PROJECT,
    "runs only against the off-switch build (npm run test:e2e:partner-off)",
  );
  for (const p of PAGES) {
    await page.goto(p);
    await expect(page.locator("[data-partner]"), p).toHaveCount(0);
  }
  // The Reveal too.
  await page.goto("/");
  await page.getByLabel("DAY", { exact: true }).selectOption("10");
  await page.getByLabel("MONTH", { exact: true }).selectOption("3");
  await page.getByRole("button", { name: /play my birthday/i }).click();
  await expect(page.getByRole("button", { name: "Skip intro" })).toBeVisible();
  await expect(page.locator("[data-partner]")).toHaveCount(0);
  // Space Grotesk is declared but never used, so never downloaded.
  const fonts = await page.evaluate(
    () => [...document.fonts].filter((f) => /Space Grotesk/i.test(f.family) && f.status !== "unloaded").length,
  );
  expect(fonts).toBe(0);
});
