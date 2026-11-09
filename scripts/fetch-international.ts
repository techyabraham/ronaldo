/**
 * Portugal senior international goals from Wikipedia
 * ("List of international goals scored by Cristiano Ronaldo", CC BY-SA 4.0).
 * Output: data/raw/international.json
 *
 * Usage: tsx scripts/fetch-international.ts [--refresh]
 */
import path from "node:path";
import * as cheerio from "cheerio";
import { tableToGrid } from "./lib/table";
import { RAW, hasFlag, log, parseDmy, wikiHtml, writeJson } from "./lib/util";
import type { RawGoal } from "../lib/schema";

const PAGE = "List_of_international_goals_scored_by_Cristiano_Ronaldo";

export type IntlRow = RawGoal & { no: number; cap: number; venueText: string };

/** Normalise Wikipedia's competition labels to short display names. */
function competitionName(text: string): string {
  if (/World Cup qualification/i.test(text)) return "World Cup qualifying";
  if (/FIFA World Cup/i.test(text)) return "World Cup";
  if (/Euro.*qualifying/i.test(text)) return "Euro qualifying";
  if (/UEFA Euro/i.test(text)) return "European Championship";
  if (/Nations League/i.test(text)) return "Nations League";
  if (/Confederations Cup/i.test(text)) return "Confederations Cup";
  if (/Friendly/i.test(text)) return "Friendly";
  return text;
}

function stageFrom(links: string[], competition: string): string | undefined {
  const href = decodeURIComponent(links.join(" ")).replace(/_/g, " ");
  if (/\bfinal\b(?!s)/i.test(href) && !/qualif/i.test(href)) return "Final";
  if (/semi-final/i.test(href)) return "Semi-final";
  if (/quarter-final/i.test(href)) return "Quarter-final";
  if (/knockout|play-off/i.test(href)) return "Knockout stage";
  if (/Group [A-L]\b/i.test(href) && !/qualif/i.test(href) && /World Cup|Championship/.test(competition))
    return "Group stage";
  return undefined;
}

/** Specific knockout rounds Wikipedia's links don't distinguish. */
const STAGE_OVERRIDES: Record<string, string> = {
  "2004-06-30": "Semi-final",
  "2016-07-06": "Semi-final",
  "2026-07-02": "Round of 32",
  "2019-06-05": "Semi-final",
  "2025-06-04": "Semi-final",
  "2025-06-08": "Final",
};

const COUNTRY_TO_OPPONENT: Record<string, string> = {
  "United States": "United States",
  "Republic of Ireland": "Republic of Ireland",
};

function venueCode(venueText: string, opponent: string): "H" | "A" | "N" {
  const country = venueText.split(",").pop()!.trim();
  if (country === "Portugal") return "H";
  const opp = COUNTRY_TO_OPPONENT[country] ?? country;
  if (opponent.startsWith(opp) || opp.startsWith(opponent)) return "A";
  return "N";
}

async function main() {
  const { html, revid } = await wikiHtml(PAGE, { refresh: hasFlag("--refresh") });
  const $ = cheerio.load(html);

  // Senior goals table: has a "Cap" column and no "Team" column (youth table has Team).
  const tables = $("table.wikitable").toArray();
  const headers = (t: (typeof tables)[number]) =>
    $(t)
      .find("tr")
      .first()
      .children("th")
      .toArray()
      .map((th) => $(th).text().trim());
  const senior = tables.find((t) => {
    const h = headers(t);
    return h.includes("Cap") && !h.includes("Team") && h.includes("Opponent");
  });
  const hatTable = tables.find((t) => {
    const h = headers(t);
    return h.includes("Goals") && h.includes("Opponent") && !h.includes("Cap");
  });
  if (!senior) throw new Error("Could not find the senior goals table");

  const grid = tableToGrid($, senior);
  const rows: IntlRow[] = [];
  for (const r of grid) {
    const no = parseInt(r[0]?.text, 10);
    if (!Number.isFinite(no)) continue;
    const [, cap, date, venue, opp, score, result, comp] = r;
    const penalty = /‡|Penalty/i.test(score.html) || score.text.includes("‡");
    const opponent = opp.text.replace(/\s+/g, " ").trim();
    const competition = competitionName(comp.text);
    const iso = parseDmy(date.text);
    rows.push({
      no,
      cap: parseInt(cap.text, 10),
      venueText: venue.text,
      date: iso,
      team: "Portugal",
      opponent,
      competition,
      stage: STAGE_OVERRIDES[iso] ?? stageFrom(comp.links, competition),
      venue: venueCode(venue.text, opponent),
      minute: null,
      scoreAfter: score.text.replace(/[‡*]/g, "").replace(/–/g, "-").trim(),
      result: result.text
        .replace(/–/g, "-")
        .replace(/\s*\(?a\.e\.t\.\)?/i, " (a.e.t.)")
        .replace(/\(a\.e\.t\.\)\s*\((\d+)-(\d+) p\)/, "(a.e.t., $1-$2 pens)")
        .replace(/\s+/g, " ")
        .trim(),
      type: penalty ? "penalty" : null,
      sources: [`wikipedia:${PAGE}@${revid}`],
    });
  }

  // Minutes from the hat-trick table, e.g. "3 – (68', 77', 83')"
  if (hatTable) {
    for (const r of tableToGrid($, hatTable)) {
      const dateCell = r[1]?.text;
      const goalsCell = r[4]?.text ?? "";
      if (!dateCell) continue;
      let iso: string;
      try {
        iso = parseDmy(dateCell.replace(/^\d{4}-\d{2}-\d{2}/, "").trim());
      } catch {
        continue;
      }
      const mins = [...goalsCell.matchAll(/(\d{1,3}(?:\+\d{1,2})?)\s*['′]\s*(?:\(?(pen\.?|p)\)?)?/g)].map((m) => ({
        minute: m[1],
        pen: !!m[2],
      }));
      const match = rows.filter((x) => x.date === iso);
      if (mins.length && mins.length === match.length) {
        match.forEach((g, i) => {
          g.minute = mins[i].minute;
          if (mins[i].pen) g.type = "penalty";
        });
      } else if (mins.length) {
        log("intl", `hat-trick ${iso}: ${mins.length} minutes vs ${match.length} rows; minutes skipped`);
      }
    }
  }

  writeJson(path.join(RAW, "international.json"), rows);
  log("intl", `wrote ${rows.length} rows (Wikipedia rev ${revid})`);
  if (rows.length !== 146) {
    console.error(`Expected 146 international goals, got ${rows.length}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
