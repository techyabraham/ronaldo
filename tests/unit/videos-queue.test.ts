import { describe, expect, it } from "vitest";
import goalsJson from "@/data/goals.json";
import { pickFamous } from "@/lib/famous";
import type { Goal } from "@/lib/schema";
import { featuredQueue, matchesFromGoals } from "../../scripts/lib/youtube";

const goals = goalsJson as Goal[];

describe("featured-first video queue", () => {
  const { featured, rest } = featuredQueue(goals);
  const all = matchesFromGoals(goals);
  const scoringDays = new Set(goals.map((g) => g.mmdd));

  it("starts with exactly one headline match per scoring date", () => {
    expect(featured).toHaveLength(scoringDays.size);
    expect(new Set(featured.map((m) => m.date.slice(5))).size).toBe(scoringDays.size);
  });
  it("each featured match is that date's pickFamous match", () => {
    for (const m of featured) {
      const sameDay = all.filter((x) => x.date.slice(5) === m.date.slice(5));
      expect(m.matchId).toBe(pickFamous(sameDay).matchId);
    }
  });
  it("orders featured dates by goal count, highest first", () => {
    const perDay = (mmdd: string) => goals.filter((g) => g.mmdd === mmdd).length;
    const counts = featured.map((m) => perDay(m.date.slice(5)));
    for (let i = 1; i < counts.length; i++) expect(counts[i]).toBeLessThanOrEqual(counts[i - 1]);
  });
  it("then everything else, newest first, with nothing lost or repeated", () => {
    expect(featured.length + rest.length).toBe(all.length);
    expect(new Set([...featured, ...rest].map((m) => m.matchId)).size).toBe(all.length);
    for (let i = 1; i < rest.length; i++) expect(rest[i].date <= rest[i - 1].date).toBe(true);
  });
});
