import { describe, expect, it } from "vitest";
import goalsJson from "@/data/goals.json";
import byDate from "@/data/generated/by-date.json";
import teamCodes from "@/data/team-codes.json";
import { ALL_MMDD } from "@/lib/dates";
import { excuseFor } from "@/lib/excuses";
import {
  calendarRows,
  nearestScoringDays,
  perTeamTotals,
  portugalGoals,
  restDayCount,
  scoringDayCount,
  seasonCount,
} from "@/lib/goals";
import { competitionLabel, teamCode } from "@/lib/labels";
import { GOAT_MOMENTS, MATCH_NOTES } from "@/lib/moments";
import type { Goal } from "@/lib/schema";

const goals = goalsJson as Goal[];
const counts = byDate as Record<string, string[]>;

describe("competitionLabel", () => {
  it("names every Euro edition in the data (2021 is Euro 2020)", () => {
    const years = [
      ...new Set(goals.filter((g) => g.competition === "European Championship").map((g) => +g.date.slice(0, 4))),
    ];
    const expected: Record<number, string> = {
      2004: "Euro 2004",
      2008: "Euro 2008",
      2012: "Euro 2012",
      2016: "Euro 2016",
      2021: "Euro 2020",
      2024: "Euro 2024",
    };
    expect(years.length).toBeGreaterThan(0);
    for (const y of years) expect(competitionLabel("European Championship", y)).toBe(expected[y]);
  });
  it("adds the year to World Cups and leaves other competitions alone", () => {
    expect(competitionLabel("World Cup", 2018)).toBe("World Cup 2018");
    expect(competitionLabel("Champions League", 2017)).toBe("Champions League");
  });
});

describe("teamCode", () => {
  const names = [...new Set(goals.flatMap((g) => [g.team, g.opponent]))];
  it("has a 3-letter code for every team and opponent in the data", () => {
    const codes = teamCodes as Record<string, string>;
    const missing = names.filter((n) => !codes[n]);
    expect(missing).toEqual([]);
    for (const n of names) expect(teamCode(n), n).toMatch(/^[A-Z]{3}$/);
  });
  it("never gives two teams the same code", () => {
    const seen = new Map<string, string>();
    for (const n of names) {
      const c = teamCode(n);
      expect(seen.get(c), `${n} and ${seen.get(c)} share ${c}`).toBeUndefined();
      seen.set(c, n);
    }
  });
});

describe("calendarRows and counts", () => {
  it("is 12 rows × 31 cells with 366 real days", () => {
    const rows = calendarRows();
    expect(rows).toHaveLength(12);
    for (const r of rows) expect(r.cells).toHaveLength(31);
    const cells = rows.flatMap((r) => r.cells);
    expect(cells.filter((c) => c.state !== "void")).toHaveLength(366);
    expect(cells.filter((c) => c.state === "hit")).toHaveLength(scoringDayCount());
    expect(rows[1].cells[28]).toMatchObject({ mmdd: "02-29", state: "miss" });
    expect(rows[1].cells[29].state).toBe("void");
  });
  it("derives the headline numbers from the data", () => {
    expect(restDayCount()).toBe(366 - scoringDayCount());
    expect(portugalGoals()).toBe(goals.filter((g) => g.team === "Portugal").length);
    expect(perTeamTotals().reduce((a, t) => a + t.goals, 0)).toBe(goals.length);
    expect(perTeamTotals()[0].team).toBe("Sporting CP");
    expect(seasonCount()).toBeGreaterThan(20);
  });
});

describe("moments and match notes", () => {
  const goalsIn = (id: string) => goals.filter((g) => g.matchId === id).length;
  it("every note points at a real match", () => {
    for (const id of Object.keys(MATCH_NOTES)) expect(goalsIn(id), id).toBeGreaterThan(0);
  });
  it("goal counts match the copy", () => {
    expect(goalsIn("2018-06-15-spain")).toBe(3); // "hat-trick vs Spain"
    expect(goalsIn("2019-03-12-atletico-madrid")).toBe(3); // "hat-trick vs Atlético"
    expect(goalsIn("2021-06-23-france")).toBe(2);
    expect(goalsIn("2017-06-03-juventus")).toBe(2); // "two goals in the final"
  });
  it("Spain hat-trick ended at 88′ and France was goals 108–109 for Portugal", () => {
    expect(goals.filter((g) => g.matchId === "2018-06-15-spain").map((g) => g.minute)).toContain("88");
    const pt = goals.filter((g) => g.team === "Portugal");
    expect(pt.findIndex((g) => g.matchId === "2021-06-23-france") + 1).toBe(108);
  });
  it("Top 3 moments are in order and link to their date pages", () => {
    expect(GOAT_MOMENTS.map((m) => m.matchId)).toEqual([
      "2018-06-15-spain",
      "2019-03-12-atletico-madrid",
      "2021-06-23-france",
    ]);
    expect(GOAT_MOMENTS[2].href).toBe("/birthday/06-23");
  });
});

describe("excuses", () => {
  const ctx = (mmdd: string) => {
    const n = nearestScoringDays(mmdd);
    return { count: (counts[mmdd] ?? []).length, before: n.before, after: n.after };
  };
  const rest = ALL_MMDD.filter((k) => !(counts[k] ?? []).length);
  const scoring = ALL_MMDD.filter((k) => (counts[k] ?? []).length);

  it("every rest day gets an excuse, and it's the same every time", () => {
    for (const k of rest) {
      const a = excuseFor(k, ctx(k));
      expect(a, k).not.toBeNull();
      expect(a!.line.length).toBeGreaterThan(10);
      expect(excuseFor(k, ctx(k))).toEqual(a);
    }
  });
  it("scoring days get none", () => {
    for (const k of scoring) expect(excuseFor(k, ctx(k))).toBeNull();
  });
  it("knows the calendar: New Year, Christmas, July, his birthday", () => {
    expect(excuseFor("01-01", ctx("01-01"))!.title).toBe("New Year's Day");
    expect(excuseFor("12-25", ctx("12-25"))!.title).toBe("Christmas Day");
    expect(excuseFor("02-05", ctx("02-05"))!.title).toBe("His own birthday");
    expect(excuseFor("07-15", ctx("07-15"))!.title).toBe("Off-season");
  });
  it("only quotes real gaps from the data", () => {
    for (const k of rest) {
      const e = excuseFor(k, ctx(k))!;
      const m = e.line.match(/(\d+) days? (later|earlier)/);
      if (!m) continue;
      const n = nearestScoringDays(k);
      const real = m[2] === "later" ? n.after?.offset : n.before?.offset;
      expect(Number(m[1]), k).toBe(real);
    }
  });
});
