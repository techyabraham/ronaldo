import path from "node:path";
import { DATA, readJson } from "./util";
import type { Team } from "../../lib/schema";

type Aliases = {
  teams: Record<string, string>;
  opponents: Record<string, string>;
  competitions: Record<string, string>;
};
const aliases = readJson<Aliases>(path.join(DATA, "aliases.json"));

/** Repair UTF-8 text that was decoded as Latin-1 ("CoruÃ±a" -> "Coruña"). */
export function fixMojibake(s: string) {
  if (!/[ÃÂ]/.test(s)) return s;
  try {
    const fixed = Buffer.from(s, "latin1").toString("utf8");
    return fixed.includes("�") ? s : fixed;
  } catch {
    return s;
  }
}

export function normTeam(raw: string): Team {
  const s = fixMojibake(raw).trim();
  const t = aliases.teams[s];
  if (!t) throw new Error(`Unknown team "${raw}" (add it to data/aliases.json "teams")`);
  return t as Team;
}

export function normOpponent(raw: string) {
  let s = fixMojibake(raw).replace(/\s+/g, " ").trim();
  if (aliases.opponents[s]) return aliases.opponents[s];
  s = s.replace(/\s+(FC|CF|AFC|SC|SFC|F\.C\.)$/i, "").trim();
  if (aliases.opponents[s]) return aliases.opponents[s];
  return s;
}

export function normCompetition(raw: string) {
  const s = fixMojibake(raw).trim();
  return aliases.competitions[s] ?? s;
}

/** Source goal-type labels -> our 4 categories. */
export function normType(raw: string | null | undefined): "penalty" | "free-kick" | "header" | "open-play" | null {
  const s = (raw ?? "").trim().toLowerCase();
  if (!s) return null;
  if (s === "penalty") return "penalty";
  if (s.includes("free kick")) return "free-kick";
  if (s === "header") return "header";
  return "open-play"; // incl. "penalty rebound", tap-ins, long shots, solo runs
}
