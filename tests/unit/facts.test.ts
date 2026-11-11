import { describe, expect, it } from "vitest";
import { ALL_MMDD, adjacentMmdd, monthFromSlug } from "@/lib/dates";
import {
  LATEST_GOAL_DATE,
  careerFacts,
  dayRank,
  goalsForDate,
  lastModifiedFor,
  lastModifiedForMonth,
  monthScoringDays,
} from "@/lib/goals";

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

describe("dayRank and careerFacts", () => {
  const counts = ALL_MMDD.map((k) => goalsForDate(k).length);

  it("ranks by goal count with shared ranks for ties", () => {
    const top = Math.max(...counts);
    const best = ALL_MMDD.filter((_, i) => counts[i] === top);
    for (const k of best) expect(dayRank(k).rank).toBe(1);
    const c = goalsForDate("06-23").length;
    expect(dayRank("06-23").rank).toBe(1 + counts.filter((x) => x > c).length);
    expect(dayRank("06-23").tied).toBe(counts.filter((x) => x === c).length > 1);
    // Every date with the same count shares one rank.
    const sameAs623 = ALL_MMDD.filter((_, i) => counts[i] === c);
    expect(new Set(sameAs623.map((k) => dayRank(k).rank)).size).toBe(1);
  });

  it("careerFacts come straight from the data", () => {
    expect(careerFacts("02-16")).toBeNull();
    const f = careerFacts("06-23")!;
    const gs = goalsForDate("06-23");
    expect(f.numbers).toEqual(gs.map((g) => g.n).sort((a, b) => a - b));
    expect(f.first.n).toBe(f.numbers[0]);
    expect(f.latest.n).toBe(f.numbers.at(-1));
    expect(f.teams.reduce((s, t) => s + t.goals, 0)).toBe(gs.length);
    expect(f.types.reduce((s, t) => s + t.count, 0) + f.unknownTypes).toBe(gs.length);
    expect(f.competitions).toContain("Euro 2020");
  });

  it("month scoring days are sorted by goals and stay in the month", () => {
    const june = monthScoringDays(6);
    expect(june.every((d) => d.mmdd.startsWith("06-") && d.count > 0)).toBe(true);
    for (let i = 1; i < june.length; i++) expect(june[i - 1].count).toBeGreaterThanOrEqual(june[i].count);
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
