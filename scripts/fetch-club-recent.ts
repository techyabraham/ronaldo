/**
 * Club goals after the Kaggle cutoff (19 Mar 2023 -> today) from Wikipedia
 * Al-Nassr season articles (CC BY-SA 4.0), plus manual rows from
 * data/manual/club-2022-2026.csv for anything Wikipedia's match boxes miss.
 *
 * Output: data/raw/club-recent.json
 * Usage: tsx scripts/fetch-club-recent.ts [--refresh]
 */
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { DATA, RAW, hasFlag, log, parseDmy, readJson, wikitext, writeJson } from "./lib/util";
import { findTemplates, headingsAt, plain, splitTop } from "./lib/wikitemplate";
import { normOpponent, normType } from "./lib/normalize";
import { HISTORIC_CUTOFF } from "./fetch-club-historic.constants";
import { RawGoalSchema, type RawGoal, type Expected } from "../lib/schema";

/** Season article titles. Add the next one each summer. */
export const SEASON_PAGES = [
  "2022–23 Al-Nassr FC season",
  "2023–24 Al Nassr FC season",
  "2024–25 Al-Nassr FC season",
  "2025–26 Al-Nassr FC season",
  "2026–27 Al-Nassr FC season",
];

/** Known pages plus any later season up to the current one (tried, skipped if the article doesn't exist yet). */
function seasonPages(now = new Date()) {
  const pages = SEASON_PAGES.map((title) => ({ title, optional: false }));
  const currentStart = now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  for (let y = 2027; y <= currentStart; y++) {
    pages.push({ title: `${y}–${String(y + 1).slice(2)} Al-Nassr FC season`, optional: true });
  }
  return pages;
}

const MANUAL = path.join(DATA, "manual", "club-2022-2026.csv");
const MANUAL_HEADER = "date,team,opponent,competition,stage,venue,minute,scoreAfter,result,type,source,notes,action\n";

const NASSR = /Nassr/i;

function competitionOf(chain: Record<number, string>): string | null {
  const all = Object.values(chain).join(" / ");
  if (/friendl|pre-season/i.test(all)) return null;
  const c = chain[3] ?? "";
  if (/Pro League/i.test(c)) return "Saudi Pro League";
  if (/King/i.test(c)) return "King's Cup";
  if (/Super Cup/i.test(c)) return "Saudi Super Cup";
  if (/Arab Club/i.test(c)) return "Arab Club Champions Cup";
  if (/Champions League Two/i.test(c)) return "AFC Champions League Two";
  if (/Champions League Elite/i.test(c)) return "AFC Champions League Elite";
  if (/Champions League/i.test(c)) return "AFC Champions League";
  return c || null;
}

function stageOf(round: string, chain: Record<number, string>, competition: string): string | undefined {
  if (competition === "Saudi Pro League") return undefined;
  const r = plain(round);
  const sub = chain[5] ?? chain[4] ?? "";
  const s = /^\d+$/.test(r) || !r ? sub : r;
  if (!s) return undefined;
  if (/^final$/i.test(s) || /^finals?$/i.test(s.trim())) return "Final";
  if (/semi/i.test(s)) return "Semi-final";
  if (/quarter/i.test(s)) return "Quarter-final";
  if (/round of 16|last 16/i.test(s)) return "Round of 16";
  if (/round of 32/i.test(s)) return "Round of 32";
  if (/group|league stage|matchday/i.test(s)) return s.match(/league stage/i) ? "League stage" : "Group stage";
  if (/play-?off/i.test(s)) return "Play-off round";
  return s;
}

type GoalEv = { minute: string; sort: number; side: 1 | 2; ronaldo: boolean; pen: boolean; og: boolean };

function minuteSort(m: string) {
  const [a, b] = m.split("+").map((x) => parseInt(x, 10));
  return a + (b ? b / 100 : 0);
}

/** Parse a goals1/goals2 field into goal events. */
function goalEvents(field: string, side: 1 | 2): GoalEv[] {
  const evs: GoalEv[] = [];
  // Each scorer is separated by <br> or newlines.
  for (const seg of field.split(/<br\s*\/?>|\n/i)) {
    const ronaldo = /Ronaldo/.test(seg);
    const re = /\{\{\s*goal\s*\|([^{}]*)\}\}/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(seg))) {
      const toks = m[1].split("|").map((t) => t.trim());
      let last: GoalEv | null = null;
      for (const t of toks) {
        const mm = t.match(/^(\d{1,3}(?:\+\d{1,2})?)'?$/);
        if (mm) {
          last = { minute: mm[1], sort: minuteSort(mm[1]), side, ronaldo, pen: false, og: false };
          evs.push(last);
        } else if (last && /^(pen\.?|p)$/i.test(t)) last.pen = true;
        else if (last && /o\.?g\.?/i.test(t)) last.og = true;
      }
    }
  }
  return evs;
}

function parseScore(s: string): [number, number] | null {
  const m = plain(s).match(/(\d+)\s*[–-]\s*(\d+)/);
  return m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : null;
}

async function fromWikipedia(refresh: boolean) {
  const goals: RawGoal[] = [];
  const perSeason: Record<string, number> = {};
  for (const { title: page, optional } of seasonPages()) {
    let text: string;
    let revid: number;
    try {
      ({ text, revid } = await wikitext(page, { refresh }));
    } catch (e) {
      if (optional) {
        log("club-recent", `${page}: not found yet, skipping`);
        continue;
      }
      throw e;
    }
    const headingAt = headingsAt(text);
    const boxes = findTemplates(text, /^football ?box( collapsible)?$/i);
    let n = 0;
    for (const b of boxes) {
      const p = b.params;
      const competition = competitionOf(headingAt(b.start));
      if (!competition) continue;
      const sd = (p.date ?? "").match(/\{\{\s*(?:start date|dts)\s*\|\s*(\d{4})\s*\|\s*(\d{1,2})\s*\|\s*(\d{1,2})/i);
      const dateRaw = plain(p.date ?? "")
        .replace(/\(.*?\)/g, "")
        .trim();
      let date: string;
      try {
        date = sd
          ? `${sd[1]}-${sd[2].padStart(2, "0")}-${sd[3].padStart(2, "0")}`
          : parseDmy(dateRaw.replace(/^\w+day,?\s*/i, ""));
      } catch {
        log("club-recent", `${page}: skipping box with date "${p.date}"`);
        continue;
      }
      if (date <= HISTORIC_CUTOFF) continue;
      const t1 = plain(p.team1 ?? "");
      const t2 = plain(p.team2 ?? "");
      const side: 1 | 2 | null = NASSR.test(t1) ? 1 : NASSR.test(t2) ? 2 : null;
      if (!side) continue;
      const ev = [...goalEvents(p.goals1 ?? "", 1), ...goalEvents(p.goals2 ?? "", 2)].sort((a, b) => a.sort - b.sort);
      const mine = ev.filter((e) => e.side === side && e.ronaldo && !e.og);
      if (!mine.length) continue;
      const score = parseScore(p.score ?? "");
      const aet = /aet|a\.e\.t|extra time/i.test(p.score ?? "");
      const opponentRaw = side === 1 ? t2 : t1;
      const neutral = /Super Cup|Arab Club/.test(competition) || /^finals?$/i.test(headingAt(b.start)[5] ?? "");
      // Running score after each goal (team first). Only trust it if it adds up to the final score.
      let us = 0;
      let them = 0;
      const after = new Map<GoalEv, string>();
      for (const e of ev) {
        if (e.side === side) us++;
        else them++;
        after.set(e, `${us}-${them}`);
      }
      const final = score ? (side === 1 ? score : ([score[1], score[0]] as [number, number])) : null;
      const consistent = final && final[0] === us && final[1] === them;
      for (const e of mine) {
        goals.push({
          date,
          team: "Al Nassr",
          opponent: normOpponent(opponentRaw),
          competition,
          stage: stageOf(p.round ?? "", headingAt(b.start), competition),
          venue: neutral ? "N" : side === 1 ? "H" : "A",
          minute: e.minute,
          scoreAfter: consistent ? after.get(e)! : null,
          result: final ? `${final[0]}-${final[1]}${aet ? " (a.e.t.)" : ""}` : null,
          type: e.pen ? "penalty" : null,
          sources: [`wikipedia:${page.replace(/ /g, "_")}@${revid}`],
        });
        n++;
      }
    }
    perSeason[page] = n;
  }
  return { goals, perSeason };
}

function fromManual(): { add: RawGoal[]; remove: { date: string; minute: string | null }[] } {
  if (!fs.existsSync(MANUAL)) {
    fs.mkdirSync(path.dirname(MANUAL), { recursive: true });
    fs.writeFileSync(MANUAL, MANUAL_HEADER);
  }
  const rows = parse(fs.readFileSync(MANUAL), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    comment: "#",
  }) as Record<string, string>[];
  const add: RawGoal[] = [];
  const remove: { date: string; minute: string | null }[] = [];
  for (const r of rows) {
    if (r.action === "remove") {
      remove.push({ date: r.date, minute: r.minute || null });
      continue;
    }
    add.push(
      RawGoalSchema.parse({
        date: r.date,
        team: r.team || "Al Nassr",
        opponent: normOpponent(r.opponent),
        competition: r.competition,
        stage: r.stage || undefined,
        venue: r.venue || null,
        minute: r.minute || null,
        scoreAfter: r.scoreAfter || null,
        result: r.result || null,
        type: normType(r.type) ?? (r.type ? null : null),
        sources: [r.source ? `manual:${r.source}` : "manual"],
        ...(r.notes ? { notes: r.notes } : {}),
      }),
    );
  }
  return { add, remove };
}

async function main() {
  const { goals, perSeason } = await fromWikipedia(hasFlag("--refresh"));
  const manual = fromManual();
  let all = goals.filter(
    (g) => !manual.remove.some((r) => r.date === g.date && (r.minute === null || r.minute === g.minute)),
  );
  all = all.concat(manual.add);
  all.sort((a, b) => a.date.localeCompare(b.date) || minuteSort(a.minute ?? "0") - minuteSort(b.minute ?? "0"));

  writeJson(path.join(RAW, "club-recent.json"), all);
  log("club-recent", "per season article (Ronaldo goals parsed):", perSeason);
  log("club-recent", `manual: +${manual.add.length} / -${manual.remove.length}; total ${all.length}`);

  // Compare with expected per-season totals so gaps are obvious.
  const expected = readJson<Expected>(path.join(DATA, "expected.json"));
  const byYear: Record<string, number> = {};
  for (const g of all) {
    const y = parseInt(g.date.slice(0, 4), 10);
    const season =
      parseInt(g.date.slice(5, 7), 10) >= 7 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`;
    byYear[season] = (byYear[season] ?? 0) + 1;
  }
  log("club-recent", "by season:", byYear, "(2022-23 excludes the 9 goals up to the Kaggle cutoff)");
  void expected;
}

// splitTop is re-exported for tests
export { splitTop };

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
