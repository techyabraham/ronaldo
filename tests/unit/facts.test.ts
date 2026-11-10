import { describe, expect, it } from "vitest";
import { ALL_MMDD, adjacentMmdd, monthFromSlug } from "@/lib/dates";
import { LATEST_GOAL_DATE, goalsForDate, lastModifiedFor, lastModifiedForMonth } from "@/lib/goals";

describe("calendar navigation", () => {
  it("wraps across the year and includes 29 February", () => {
    expect(adjacentMmdd("12-31", 1)).toBe("01-01");
    expect(adjacentMmdd("01-01", -1)).toBe("12-31");
    expect(adjacentMmdd("02-28", 1)).toBe("02-29");
    expect(adjacentMmdd("02-29", 1)).toBe("03-01");
    expect(adjacentMmdd("03-01", -1)).toBe("02-29");
  });

  it("month slugs round-trip and reject anything else", () => {
    expect(monthFromSlug("june")).toBe(6);
    expect(monthFromSlug("June")).toBeNull();
    expect(monthFromSlug("13")).toBeNull();
  });
});

describe("lastModified", () => {
  const latest = new Date(`${LATEST_GOAL_DATE}T00:00:00Z`).getTime();

  it("is a valid date, never after the latest goal (so never in the future), for every page", () => {
    for (const k of ALL_MMDD) {
      const d = lastModifiedFor(k);
      expect(Number.isNaN(d.getTime()), k).toBe(false);
      expect(d.getTime(), k).toBeLessThanOrEqual(latest);
      expect(d.getTime(), k).toBeLessThanOrEqual(Date.now());
    }
    for (let m = 1; m <= 12; m++) expect(lastModifiedForMonth(m).getTime()).toBeLessThanOrEqual(latest);
  });

  it("a scoring date's lastModified is its newest goal", () => {
    const newest = goalsForDate("06-23")
      .map((g) => g.date)
      .sort()
      .at(-1);
    expect(lastModifiedFor("06-23").toISOString().slice(0, 10)).toBe(newest);
  });

  it("a rest day takes the newer of its two nearest scoring days", () => {
    const near = [...goalsForDate("02-15"), ...goalsForDate("02-17")].map((g) => g.date).sort();
    expect(goalsForDate("02-16")).toHaveLength(0);
    expect(lastModifiedFor("02-16").toISOString().slice(0, 10)).toBe(near.at(-1));
  });
});
