/**
 * Club goals 2002 -> 18 Mar 2023 from the Kaggle dataset
 * "Lionel Messi vs Cristiano Ronaldo | Club Goals" by Azmine Toushik Wasi (ODbL).
 * https://www.kaggle.com/datasets/azminetoushikwasi/lionel-messi-vs-cristiano-ronaldo-club-goals
 *
 * The CSV is committed at data/raw/kaggle-messi-vs-ronaldo-club-goals.csv.
 * If it is missing, this script downloads it from Kaggle's public endpoint.
 * Output: data/raw/club-historic.json
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import os from "node:os";
import { parse } from "csv-parse/sync";
import { RAW, log, writeJson } from "./lib/util";
import { normCompetition, normOpponent, normTeam, normType } from "./lib/normalize";
import type { RawGoal } from "../lib/schema";

const CSV = path.join(RAW, "kaggle-messi-vs-ronaldo-club-goals.csv");
const KAGGLE =
  "https://www.kaggle.com/api/v1/datasets/download/azminetoushikwasi/lionel-messi-vs-cristiano-ronaldo-club-goals";
import { HISTORIC_CUTOFF } from "./fetch-club-historic.constants";

type Row = {
  Player: string;
  Season: string;
  Competition: string;
  Matchday: string;
  Date: string;
  Venue: string;
  Club: string;
  Opponent: string;
  Result: string;
  Minute: string;
  At_score: string;
  Type: string;
};

/** Excel turned "3:0" into "3:00" and "0:2" into "0:02"; undo that. */
function fixScore(s: string) {
  return s.trim().replace(/^(\d+):0(\d)\b/, "$1:$2");
}

/** "home:away" -> "team-opponent" */
function teamFirst(score: string, venue: string) {
  const m = fixScore(score).match(/^(\d+):(\d+)/);
  if (!m) return null;
  return venue === "A" ? `${m[2]}-${m[1]}` : `${m[1]}-${m[2]}`;
}

const LEAGUES = new Set(["Primeira Liga", "Premier League", "La Liga", "Serie A", "Saudi Pro League"]);

function stageOf(matchday: string, competition: string): string | undefined {
  if (LEAGUES.has(competition) || /^\d+$/.test(matchday)) return undefined;
  const m = matchday.trim().toLowerCase();
  const map: Record<string, string> = {
    final: "Final",
    "semi-finals": "Semi-final",
    "quarter-finals": "Quarter-final",
    "last 16": "Round of 16",
    "group stage": "Group stage",
    "3rd round": "Third round",
    "4th round": "Fourth round",
    "6th round": "Sixth round",
  };
  if (map[m]) return map[m];
  return m ? m[0].toUpperCase() + m.slice(1) : undefined;
}

function ensureCsv() {
  if (fs.existsSync(CSV)) return;
  log("club-historic", "CSV missing, downloading from Kaggle…");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kaggle-"));
  const zip = path.join(tmp, "data.zip");
  execFileSync("curl", ["-sSL", "-o", zip, KAGGLE]);
  execFileSync("tar", ["-xf", zip, "-C", tmp]);
  fs.copyFileSync(path.join(tmp, "data.csv"), CSV);
}

function main() {
  ensureCsv();
  const rows = parse(fs.readFileSync(CSV), { columns: true, bom: true, trim: true }) as Row[];
  const out: RawGoal[] = [];
  for (const r of rows) {
    if (r.Player !== "Cristiano Ronaldo") continue;
    if (r.Date > HISTORIC_CUTOFF) continue;
    const competition = normCompetition(r.Competition);
    const pens = r.Result.match(/^(\d+):(\d+) on pens/i);
    const aet = /AET/i.test(r.Result);
    let result = teamFirst(r.Result, r.Venue);
    let notes: string | undefined;
    if (pens) {
      result = null;
      notes = `Match decided on penalties (shoot-out ${r.Venue === "A" ? `${pens[2]}-${pens[1]}` : `${pens[1]}-${pens[2]}`}); goal scored in play.`;
    } else if (result && aet) result += " (a.e.t.)";
    const stage = stageOf(r.Matchday, competition);
    // One-off finals are played at neutral venues.
    const neutral =
      (stage === "Final" && /Champions League|Club World Cup|UEFA Super Cup/.test(competition)) ||
      competition === "Club World Cup" ||
      competition === "UEFA Super Cup";
    out.push({
      date: r.Date,
      team: normTeam(r.Club),
      opponent: normOpponent(r.Opponent),
      competition,
      stage,
      venue: neutral ? "N" : r.Venue === "H" || r.Venue === "A" ? r.Venue : null,
      minute: r.Minute || null,
      scoreAfter: teamFirst(r.At_score, r.Venue),
      result,
      type: normType(r.Type),
      sources: ["kaggle:azminetoushikwasi/lionel-messi-vs-cristiano-ronaldo-club-goals"],
      ...(notes ? { notes } : {}),
    });
  }
  writeJson(path.join(RAW, "club-historic.json"), out);
  const per: Record<string, number> = {};
  out.forEach((g) => (per[g.team] = (per[g.team] ?? 0) + 1));
  log("club-historic", `wrote ${out.length} goals up to ${HISTORIC_CUTOFF}`, per);
}

main();
