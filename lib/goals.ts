import "server-only";
import goalsJson from "@/data/goals.json";
import byDateJson from "@/data/generated/by-date.json";
import videosJson from "@/data/videos.json";
import expectedJson from "@/data/expected.json";
import { TEAMS, type Goal, type MatchVideo, type Team } from "./schema";
import { ALL_MMDD, DAYS_IN_MONTH, MONTH_NAMES, dayIndex, formatMmdd } from "./dates";

const goals = goalsJson as Goal[];
const byId = new Map(goals.map((g) => [g.id, g]));
const byDate = byDateJson as Record<string, string[]>;
const videos = videosJson as Record<string, MatchVideo>;

export const TOTAL_GOALS = goals.length;
export const DATA_UPDATED = (expectedJson as { checkedAt: string }).checkedAt;
export const LATEST_GOAL_DATE = (expectedJson as { latestGoalDate: string }).latestGoalDate;

export type VideoInfo = { youtubeId: string; startSeconds?: number; title?: string; channel?: string; status: string };

export type Match = {
  matchId: string;
  date: string;
  year: number;
  team: Goal["team"];
  opponent: string;
  competition: string;
  stage?: string;
  venue: Goal["venue"];
  result: string | null;
  goals: Pick<Goal, "id" | "n" | "minute" | "type" | "scoreAfter" | "notes">[];
  video: VideoInfo | null;
};

export function goalsForDate(mmdd: string): Goal[] {
  return (byDate[mmdd] ?? []).map((id) => byId.get(id)!).filter(Boolean);
}

function videoFor(matchId: string): VideoInfo | null {
  const v = videos[matchId];
  if (!v || !v.youtubeId || (v.status !== "verified" && v.status !== "auto")) return null;
  return { youtubeId: v.youtubeId, startSeconds: v.startSeconds, title: v.title, channel: v.channel, status: v.status };
}

/** Goals on a date grouped by match, newest first. */
export function matchesForDate(mmdd: string): Match[] {
  const map = new Map<string, Match>();
  for (const g of goalsForDate(mmdd)) {
    let m = map.get(g.matchId);
    if (!m) {
      m = {
        matchId: g.matchId,
        date: g.date,
        year: parseInt(g.date.slice(0, 4), 10),
        team: g.team,
        opponent: g.opponent,
        competition: g.competition,
        stage: g.stage,
        venue: g.venue,
        result: g.result,
        goals: [],
        video: videoFor(g.matchId),
      };
      map.set(g.matchId, m);
    }
    m.goals.push({ id: g.id, n: g.n, minute: g.minute, type: g.type, scoreAfter: g.scoreAfter, notes: g.notes });
  }
  return [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
}

export type DaySummary = { mmdd: string; label: string; count: number; teams: string[]; years: number[] };

export function summarise(mmdd: string): DaySummary {
  const gs = goalsForDate(mmdd);
  return {
    mmdd,
    label: formatMmdd(mmdd),
    count: gs.length,
    teams: [...new Set(gs.map((g) => g.team))],
    years: [...new Set(gs.map((g) => parseInt(g.date.slice(0, 4), 10)))].sort(),
  };
}

export type Nearest = { mmdd: string; label: string; offset: number; count: number; headline: string };

/** Closest dates before and after `mmdd` (wrapping around the year) on which he scored. */
export function nearestScoringDays(mmdd: string): { before: Nearest | null; after: Nearest | null } {
  const i = dayIndex(mmdd);
  const find = (dir: 1 | -1): Nearest | null => {
    for (let k = 1; k < ALL_MMDD.length; k++) {
      const key = ALL_MMDD[(i + dir * k + ALL_MMDD.length) % ALL_MMDD.length];
      const ms = matchesForDate(key);
      if (ms.length) {
        const top = pickFamous(ms);
        return {
          mmdd: key,
          label: formatMmdd(key),
          offset: k,
          count: goalsForDate(key).length,
          headline: `vs ${top.opponent} in ${top.year}`,
        };
      }
    }
    return null;
  };
  return { before: find(-1), after: find(1) };
}

const STAGE_WEIGHT: [RegExp, number][] = [
  [/^Final$/i, 100],
  [/Semi/i, 60],
  [/Quarter/i, 40],
  [/Round of|Knockout|Play-off/i, 25],
];
const COMP_WEIGHT: [RegExp, number][] = [
  [/^World Cup$/, 40],
  [/^European Championship$/, 35],
  [/^Champions League$/, 30],
  [/Nations League/, 10],
];

/** The headline match of a day: prefer finals and knockouts, big tournaments, multi-goal games, then recency. */
export function pickFamous(ms: Match[]): Match {
  const score = (m: Match) =>
    (STAGE_WEIGHT.find(([re]) => re.test(m.stage ?? ""))?.[1] ?? 0) +
    (COMP_WEIGHT.find(([re]) => re.test(m.competition))?.[1] ?? 0) +
    m.goals.length * 8 +
    m.year / 1000;
  return [...ms].sort((a, b) => score(b) - score(a))[0];
}

export function popularDays(limit = 6): DaySummary[] {
  return ALL_MMDD.map(summarise)
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count || a.mmdd.localeCompare(b.mmdd))
    .slice(0, limit);
}

export function scoringDayCount() {
  return ALL_MMDD.filter((k) => (byDate[k] ?? []).length > 0).length;
}

/** Light per-day index for the client "Today" chip: only counts, ~2 KB. */
export function countsByDay(): Record<string, number> {
  return Object.fromEntries(ALL_MMDD.map((k) => [k, (byDate[k] ?? []).length]));
}

/** Calendar dates (of 366) on which he has never scored. */
export function restDayCount() {
  return ALL_MMDD.length - scoringDayCount();
}

export function portugalGoals() {
  return goals.filter((g) => g.team === "Portugal").length;
}

/** Distinct football seasons (July–June) with at least one goal. */
export function seasonCount() {
  return new Set(
    goals.map((g) => {
      const y = parseInt(g.date.slice(0, 4), 10);
      const m = parseInt(g.date.slice(5, 7), 10);
      return y - (m < 7 ? 1 : 0);
    }),
  ).size;
}

/** Goals per team in the canonical TEAMS order (career chronology), for the Reveal ticker. */
export function perTeamTotals(): { team: Team; goals: number }[] {
  return TEAMS.map((team) => ({ team, goals: goals.filter((g) => g.team === team).length }));
}

/** Most goals on any single calendar date (for Trending progress bars). */
export function maxDayCount() {
  return Math.max(...ALL_MMDD.map((k) => (byDate[k] ?? []).length));
}

export type CalendarCell = { mmdd: string; day: number; state: "hit" | "miss" | "void"; count: number };
export type CalendarRow = { month: number; initial: string; label: string; cells: CalendarCell[] };

/** 12 rows × 31 cells. Days past a month's end are "void"; 29 Feb is a real (leap-year) day. */
export function calendarRows(): CalendarRow[] {
  const counts = countsByDay();
  return DAYS_IN_MONTH.map((days, i) => ({
    month: i + 1,
    initial: MONTH_NAMES[i][0],
    label: MONTH_NAMES[i],
    cells: Array.from({ length: 31 }, (_, d) => {
      const key = `${String(i + 1).padStart(2, "0")}-${String(d + 1).padStart(2, "0")}`;
      if (d + 1 > days) return { mmdd: key, day: d + 1, state: "void" as const, count: 0 };
      const count = counts[key] ?? 0;
      return { mmdd: key, day: d + 1, state: count > 0 ? ("hit" as const) : ("miss" as const), count };
    }),
  }));
}
