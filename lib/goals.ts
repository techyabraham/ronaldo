import "server-only";
import goalsJson from "@/data/goals.json";
import byDateJson from "@/data/generated/by-date.json";
import videosJson from "@/data/videos.json";
import expectedJson from "@/data/expected.json";
import { TEAMS, type Goal, type MatchVideo, type Team } from "./schema";
import { ALL_MMDD, DAYS_IN_MONTH, MONTH_NAMES, dayIndex, formatMmdd } from "./dates";
import { pickFamous } from "./famous";

const goals = goalsJson as Goal[];
const byId = new Map(goals.map((g) => [g.id, g]));
const byDate = byDateJson as Record<string, string[]>;
const videos = videosJson as Record<string, MatchVideo>;

export const TOTAL_GOALS = goals.length;
export const DATA_UPDATED = (expectedJson as { checkedAt: string }).checkedAt;
export const LATEST_GOAL_DATE = (expectedJson as { latestGoalDate: string }).latestGoalDate;

/** Date of his first official goal (the start of the dataset). */
export const FIRST_GOAL_DATE = goals.reduce((min, g) => (g.date < min ? g.date : min), goals[0].date);

export type VideoInfo = {
  youtubeId: string;
  startSeconds?: number;
  title?: string;
  channel?: string;
  status: string;
  publishedAt?: string;
};

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
  return {
    youtubeId: v.youtubeId,
    startSeconds: v.startSeconds,
    title: v.title,
    channel: v.channel,
    status: v.status,
    publishedAt: v.publishedAt,
  };
}

/** Latest goal date (YYYY-MM-DD) among the given MM-DDs, or null if none of them has a goal. */
function latestGoalOn(keys: string[]): string | null {
  let best: string | null = null;
  for (const k of keys) for (const g of goalsForDate(k)) if (!best || g.date > best) best = g.date;
  return best;
}

const asDate = (iso: string) => new Date(`${iso}T00:00:00Z`);

/**
 * When a date page's content last changed: its newest goal. A no-goal page changes when its nearest-goal content
 * does, so it takes the newer of its two nearest scoring days' latest goals.
 */
export function lastModifiedFor(mmdd: string): Date {
  const own = latestGoalOn([mmdd]);
  if (own) return asDate(own);
  const { before, after } = nearestScoringDays(mmdd);
  const near = latestGoalOn([before?.mmdd, after?.mmdd].filter((k): k is string => !!k));
  return asDate(near ?? LATEST_GOAL_DATE);
}

/** Month hub (1–12): its newest goal. */
export function lastModifiedForMonth(month: number): Date {
  const prefix = `${String(month).padStart(2, "0")}-`;
  return asDate(latestGoalOn(ALL_MMDD.filter((k) => k.startsWith(prefix))) ?? LATEST_GOAL_DATE);
}

/** "2026-10-29" from a Date (UTC), for JSON-LD dateModified. */
export const isoDay = (d: Date) => d.toISOString().slice(0, 10);

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

export type Nearest = {
  mmdd: string;
  label: string;
  offset: number;
  count: number;
  headline: string;
  /** The date's most famous match, for "Watch" buttons. */
  team: Team;
  opponent: string;
  year: number;
  competition: string;
  result: string | null;
  goals: number;
};

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
          team: top.team,
          opponent: top.opponent,
          year: top.year,
          competition: top.competition,
          result: top.result,
          goals: top.goals.length,
        };
      }
    }
    return null;
  };
  return { before: find(-1), after: find(1) };
}

// Ranking lives in lib/famous.ts (no server-only) so the data scripts can share it.
export { famousScore, pickFamous, rankFamous } from "./famous";

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
