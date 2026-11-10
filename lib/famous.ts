/**
 * Which match of a day is the "headline" one: finals and knockouts, big tournaments, multi-goal games,
 * then recency. Pure (no server-only), so both the pages (via lib/goals.ts) and the data scripts can use it.
 */
export type FamousLike = {
  stage?: string;
  competition: string;
  /** Either the year, or an ISO date it can be read from. */
  year?: number;
  date?: string;
  /** Number of goals, or the list of goals. */
  goals: number | readonly unknown[];
};

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

export function famousScore(m: FamousLike) {
  const goals = typeof m.goals === "number" ? m.goals : m.goals.length;
  const year = m.year ?? (m.date ? parseInt(m.date.slice(0, 4), 10) : 0);
  return (
    (STAGE_WEIGHT.find(([re]) => re.test(m.stage ?? ""))?.[1] ?? 0) +
    (COMP_WEIGHT.find(([re]) => re.test(m.competition))?.[1] ?? 0) +
    goals * 8 +
    year / 1000
  );
}

/** Matches of a day, most famous first. */
export function rankFamous<T extends FamousLike>(ms: readonly T[]): T[] {
  return [...ms].sort((a, b) => famousScore(b) - famousScore(a));
}

/** The headline match of a day. */
export function pickFamous<T extends FamousLike>(ms: readonly T[]): T {
  return rankFamous(ms)[0];
}
