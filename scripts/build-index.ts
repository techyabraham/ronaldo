/** data/goals.json -> data/generated/by-date.json (all 366 MM-DD keys, empty arrays allowed). */
import path from "node:path";
import { DATA, log, readJson, writeJson } from "./lib/util";
import { ALL_MMDD } from "../lib/dates";
import type { Goal } from "../lib/schema";

export function buildIndex(goals: Goal[]) {
  const idx: Record<string, string[]> = Object.fromEntries(ALL_MMDD.map((k) => [k, [] as string[]]));
  for (const g of goals) {
    if (!idx[g.mmdd]) throw new Error(`Goal ${g.id} has invalid mmdd ${g.mmdd}`);
    idx[g.mmdd].push(g.id);
  }
  return idx;
}

if (require.main === module) {
  const goals = readJson<Goal[]>(path.join(DATA, "goals.json"));
  const idx = buildIndex(goals);
  writeJson(path.join(DATA, "generated", "by-date.json"), idx);
  const nonEmpty = Object.values(idx).filter((v) => v.length).length;
  log("index", `wrote ${Object.keys(idx).length} keys, ${nonEmpty} with goals`);
}
