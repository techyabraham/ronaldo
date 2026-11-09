/**
 * Merge raw sources -> data/goals.json
 *  - international (Wikipedia), club-historic (Kaggle), club-recent (Wikipedia + manual)
 *  - de-duplicates on (date, team, minute), merging `sources`
 *  - assigns career goal numbers `n` in chronological order, stable ids and matchIds
 */
import path from "node:path";
import fs from "node:fs";
import { DATA, RAW, log, readJson, slug, writeJson } from "./lib/util";
import { GoalsSchema, RawGoalSchema, type Goal, type RawGoal } from "../lib/schema";

const INPUTS = ["international.json", "club-historic.json", "club-recent.json"];

function minuteSort(m: string | null) {
  if (!m) return Number.NaN;
  const [a, b] = m.split("+").map((x) => parseInt(x, 10));
  return a + (b ? b / 100 : 0);
}

export function buildGoals(raws: RawGoal[]): Goal[] {
  // Strip helper fields and validate.
  const clean = raws.map((r) => {
    const g = RawGoalSchema.parse(r);
    return g;
  });

  // De-duplicate.
  const byKey = new Map<string, RawGoal>();
  const order: RawGoal[] = [];
  for (const g of clean) {
    const key = g.minute ? `${g.date}|${g.team}|${g.minute}` : null;
    const existing = key ? byKey.get(key) : undefined;
    if (existing) {
      existing.sources = [...new Set([...existing.sources, ...g.sources])];
      continue;
    }
    if (key) byKey.set(key, g);
    order.push(g);
  }

  // Chronological, then by minute within the match (unknown minutes keep source order).
  const indexed = order.map((g, i) => ({ g, i }));
  indexed.sort((a, b) => {
    if (a.g.date !== b.g.date) return a.g.date.localeCompare(b.g.date);
    const ma = minuteSort(a.g.minute);
    const mb = minuteSort(b.g.minute);
    if (!Number.isNaN(ma) && !Number.isNaN(mb) && ma !== mb) return ma - mb;
    return a.i - b.i;
  });

  const perMatch = new Map<string, number>();
  return indexed.map(({ g }, i) => {
    const matchId = `${g.date}-${slug(g.opponent)}`;
    const k = (perMatch.get(matchId) ?? 0) + 1;
    perMatch.set(matchId, k);
    const goal: Goal = {
      id: `${matchId}-${k}`,
      n: i + 1,
      date: g.date,
      mmdd: g.date.slice(5),
      team: g.team,
      opponent: g.opponent,
      competition: g.competition,
      ...(g.stage ? { stage: g.stage } : {}),
      venue: g.venue,
      minute: g.minute,
      scoreAfter: g.scoreAfter,
      result: g.result,
      type: g.type,
      matchId,
      sources: g.sources,
      ...(g.notes ? { notes: g.notes } : {}),
    };
    return goal;
  });
}

function main() {
  const raws: RawGoal[] = [];
  for (const f of INPUTS) {
    const file = path.join(RAW, f);
    if (!fs.existsSync(file)) throw new Error(`Missing ${file}; run npm run data:fetch first`);
    const rows = readJson<(RawGoal & Record<string, unknown>)[]>(file);
    for (const r of rows) {
      // drop source-specific helper fields
      const { no: _no, cap: _cap, venueText: _vt, ...rest } = r as Record<string, unknown>;
      void _no;
      void _cap;
      void _vt;
      raws.push(rest as RawGoal);
    }
    log("build", `${f}: ${rows.length}`);
  }
  const goals = GoalsSchema.parse(buildGoals(raws));
  writeJson(path.join(DATA, "goals.json"), goals);
  log("build", `wrote data/goals.json with ${goals.length} goals`);
}

if (require.main === module) main();
