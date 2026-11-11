import { describe, expect, it } from "vitest";
import { ALL_MMDD, MONTH_NAMES } from "@/lib/dates";
import {
  ABOUT_DESCRIPTION,
  ABOUT_TITLE,
  CALENDAR_DESCRIPTION,
  CALENDAR_TITLE,
  DESC_MAX,
  DESC_MIN,
  HOME_DESCRIPTION,
  HOME_OG_ALT,
  HOME_TITLE,
  KEYWORDS,
  TITLE_MAX,
  dateDescription,
  dateOgAlt,
  dateTitle,
  isProductionDeploy,
  monthAnswer,
  monthDescription,
  monthTitle,
  robotsFor,
  socialMeta,
  trimAt,
  withBrand,
} from "@/lib/seo";
import { TOTAL_GOALS } from "@/lib/goals";

describe("titles", () => {
  const dateTitles = ALL_MMDD.map(dateTitle);

  it("every route's rendered title is at most 60 characters", () => {
    const all = [
      HOME_TITLE,
      withBrand(CALENDAR_TITLE),
      withBrand(ABOUT_TITLE),
      ...MONTH_NAMES.map((_, i) => withBrand(monthTitle(i + 1))),
      ...dateTitles,
    ];
    for (const t of all) expect(t.length, t).toBeLessThanOrEqual(TITLE_MAX);
  });

  it("all 366 date titles are unique", () => {
    expect(new Set(dateTitles).size).toBe(366);
  });

  it("answers yes or no correctly", () => {
    expect(dateTitle("06-23")).toMatch(/^Did Ronaldo score on 23 June\? Yes, 4 goals/);
    expect(dateTitle("02-16")).toMatch(/^Did Ronaldo score on 16 February\? (No|Never)/);
    expect(dateTitle("02-05")).toMatch(/^Did Ronaldo score on 5 February\? (No|Never)/);
  });
});

describe("descriptions", () => {
  const descs = ALL_MMDD.map(dateDescription);

  it("are 120–155 characters, unique, and answer first", () => {
    for (const [i, d] of descs.entries()) {
      expect(d.length, `${ALL_MMDD[i]}: ${d}`).toBeGreaterThanOrEqual(DESC_MIN);
      expect(d.length, `${ALL_MMDD[i]}: ${d}`).toBeLessThanOrEqual(DESC_MAX);
      expect(d, ALL_MMDD[i]).toMatch(/^(Yes|No)\. /);
    }
    expect(new Set(descs).size).toBe(366);
  });

  it("month hubs: in range, unique, and the answer paragraph carries the numbers", () => {
    const ds = MONTH_NAMES.map((_, i) => monthDescription(i + 1));
    expect(new Set(ds).size).toBe(12);
    for (const d of ds) {
      expect(d.length, d).toBeGreaterThanOrEqual(DESC_MIN);
      expect(d.length, d).toBeLessThanOrEqual(DESC_MAX);
    }
    expect(monthAnswer(6)).toMatch(
      /^Cristiano Ronaldo has scored \d+ official goals in June, on \d+ of its 30 dates\. His best June date is \d+ June with \d+ goals\.$/,
    );
  });

  it("static routes are in range too", () => {
    for (const d of [HOME_DESCRIPTION, CALENDAR_DESCRIPTION, ABOUT_DESCRIPTION]) {
      expect(d.length, d).toBeGreaterThanOrEqual(DESC_MIN);
      expect(d.length, d).toBeLessThanOrEqual(DESC_MAX);
    }
  });

  it("trims at a word boundary, never mid-word", () => {
    const s = "Cristiano Ronaldo scored a header against Manchester City";
    const t = trimAt(s, 30);
    expect(t.length).toBeLessThanOrEqual(30);
    expect(s.startsWith(t)).toBe(true);
    expect(s[t.length]).toBe(" ");
    for (const d of descs) expect(d).not.toMatch(/\s$/);
  });
});

describe("site-wide", () => {
  it("keywords carry the live total, not a hard-coded number", () => {
    expect(KEYWORDS).toContain(`Ronaldo ${TOTAL_GOALS} goals`);
    expect(KEYWORDS.filter((k) => /\d{3} goals/.test(k))).toHaveLength(1);
  });

  it("OG alts reflect the copy", () => {
    expect(HOME_OG_ALT).toBe("Has Ronaldo scored on your birthday? GOAT Day");
    expect(dateOgAlt("06-23")).toBe("Ronaldo scored 4 goals on 23 June");
    expect(dateOgAlt("02-16")).toBe("Ronaldo never scored on 16 February");
  });

  it("socialMeta never sets an images key unless asked (it would wipe file-based OG images)", () => {
    const m = socialMeta({ title: "t", description: "d", path: "/birthday/06-23" });
    expect(m.openGraph).not.toHaveProperty("images");
    expect(m.twitter).not.toHaveProperty("images");
    expect(m.alternates?.canonical).toBe("/birthday/06-23");
    expect(m.openGraph).toMatchObject({ url: "/birthday/06-23", siteName: "GOAT Day", locale: "en_GB" });
    const h = socialMeta({ title: "t", description: "d", path: "/about", homeImage: true });
    expect(h.openGraph).toHaveProperty("images");
  });

  it("only the Vercel production deployment is indexable", () => {
    expect(isProductionDeploy({ VERCEL_ENV: "production" })).toBe(true);
    expect(isProductionDeploy({ VERCEL_ENV: "preview" })).toBe(false);
    expect(isProductionDeploy({})).toBe(false);
  });

  it("robots: production allows crawling and lists the sitemap; previews block everything", () => {
    const www = "https://www.hasronaldoscoredonyourbirthday.xyz";
    const prod = robotsFor(true, www);
    expect(prod.rules).toEqual({ userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] });
    expect(prod.sitemap).toContain(`${www}/sitemap.xml`);
    expect(prod.host).toBe(www);
    expect(robotsFor(false, www)).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });
});
