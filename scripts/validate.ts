/**
 * Dataset validation. Exits non-zero on any failure; runs in CI and before every build.
 * Usage: tsx scripts/validate.ts [--quiet]
 */
import path from "node:path";
import fs from "node:fs";
import { DATA, ROOT, hasFlag, readJson } from "./lib/util";
import { ALL_MMDD } from "../lib/dates";
import { ByDateSchema, ExpectedSchema, GoalsSchema, TEAMS, VideosSchema, type Goal } from "../lib/schema";

type Known = { date: string; team: string; opponent: string; count: number; label: string };

export function validate(goals: Goal[], opts: { today?: string } = {}) {
  const errors: string[] = [];
  const expected = ExpectedSchema.parse(readJson(path.join(DATA, "expected.json")));
  const today = opts.today ?? new Date().toISOString().slice(0, 10);

  if (goals.length !== expected.total) errors.push(`Total goals ${goals.length} != expected ${expected.total}`);

  const perTeam: Record<string, number> = {};
  for (const g of goals) perTeam[g.team] = (perTeam[g.team] ?? 0) + 1;
  for (const t of TEAMS) {
    const want = expected.perTeam[t];
    if (want !== undefined && (perTeam[t] ?? 0) !== want)
      errors.push(`${t}: ${perTeam[t] ?? 0} goals != expected ${want}`);
  }
  if ((perTeam["Portugal"] ?? 0) !== 146)
    errors.push(`Portugal goals must be exactly 146 (got ${perTeam["Portugal"] ?? 0})`);

  const seen = new Set<string>();
  const ids = new Set<string>();
  goals.forEach((g, i) => {
    const d = new Date(g.date + "T00:00:00Z");
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== g.date)
      errors.push(`${g.id}: invalid date ${g.date}`);
    if (g.date < "2002-10-07" || g.date > today) errors.push(`${g.id}: date ${g.date} out of range`);
    if (g.mmdd !== g.date.slice(5)) errors.push(`${g.id}: mmdd mismatch`);
    if (g.n !== i + 1) errors.push(`${g.id}: n=${g.n} but position ${i + 1}`);
    if (i > 0 && goals[i - 1].date > g.date) errors.push(`${g.id}: not sorted by date`);
    const key = `${g.date}|${g.opponent}|${g.minute ?? `#${g.id}`}`;
    if (seen.has(key)) errors.push(`Duplicate (date, opponent, minute): ${key}`);
    seen.add(key);
    if (ids.has(g.id)) errors.push(`Duplicate id ${g.id}`);
    ids.add(g.id);
  });
  if (goals.at(-1) && goals.at(-1)!.date !== expected.latestGoalDate)
    errors.push(`Latest goal ${goals.at(-1)!.date} != expected.latestGoalDate ${expected.latestGoalDate}`);

  // Index coverage
  const idxFile = path.join(DATA, "generated", "by-date.json");
  if (fs.existsSync(idxFile)) {
    const idx = ByDateSchema.parse(readJson(idxFile));
    for (const k of ALL_MMDD) if (!idx[k]) errors.push(`Index missing key ${k}`);
    const indexed = Object.values(idx).flat();
    if (indexed.length !== goals.length) errors.push(`Index has ${indexed.length} ids, dataset has ${goals.length}`);
    for (const id of indexed) if (!ids.has(id)) errors.push(`Index references unknown id ${id}`);
  }

  // Videos file shape (if present)
  const vidFile = path.join(DATA, "videos.json");
  if (fs.existsSync(vidFile)) {
    const vids = VideosSchema.parse(readJson(vidFile));
    const matchIds = new Set(goals.map((g) => g.matchId));
    for (const k of Object.keys(vids)) if (!matchIds.has(k)) errors.push(`videos.json: unknown matchId ${k}`);
  }

  // Known goals
  const known = readJson<Known[]>(path.join(ROOT, "tests", "fixtures", "known-goals.json"));
  for (const k of known) {
    const n = goals.filter((g) => g.date === k.date && g.team === k.team && g.opponent === k.opponent).length;
    if (n !== k.count)
      errors.push(`Known goal "${k.label}" (${k.date} ${k.team} v ${k.opponent}): found ${n}, expected ${k.count}`);
  }

  return { errors, perTeam };
}

export function summary(goals: Goal[]) {
  const perYear: Record<string, number> = {};
  const perTeam: Record<string, number> = {};
  const perDay: Record<string, number> = {};
  for (const g of goals) {
    perYear[g.date.slice(0, 4)] = (perYear[g.date.slice(0, 4)] ?? 0) + 1;
    perTeam[g.team] = (perTeam[g.team] ?? 0) + 1;
    perDay[g.mmdd] = (perDay[g.mmdd] ?? 0) + 1;
  }
  const days = Object.entries(perDay).sort((a, b) => b[1] - a[1]);
  return {
    perYear,
    perTeam,
    daysWithGoals: days.length,
    daysWithout: ALL_MMDD.length - days.length,
    topDays: days.slice(0, 10),
    emptyDays: ALL_MMDD.filter((k) => !perDay[k]),
  };
}

if (require.main === module) {
  const goals = GoalsSchema.parse(readJson(path.join(DATA, "goals.json")));
  const { errors } = validate(goals);
  if (!hasFlag("--quiet")) {
    const s = summary(goals);
    console.log("Goals per year:", s.perYear);
    console.log("Goals per team:", s.perTeam);
    console.log(`Calendar days with >=1 goal: ${s.daysWithGoals} / 366; days with none: ${s.daysWithout}`);
    console.log("Top days:", s.topDays.map(([d, n]) => `${d}: ${n}`).join(", "));
  }
  if (errors.length) {
    console.error(`\n✗ ${errors.length} validation error(s):\n  - ` + errors.join("\n  - "));
    process.exit(1);
  }
  console.log(`✓ dataset valid: ${goals.length} goals`);
}
