/**
 * Weekly refresh (run by .github/workflows/refresh.yml, or locally with `npm run data:refresh`).
 *
 *  1. Re-fetches the Al-Nassr season articles and the club career-statistics table (bypassing the cache).
 *  2. Rebuilds data/goals.json + the by-date index.
 *  3. If the new goal count agrees with Wikipedia's career table, bumps data/expected.json.
 *     If not, leaves expected.json alone so validation fails and a human must reconcile
 *     (usually via data/manual/club-2022-2026.csv).
 *  4. Writes .refresh/pr-body.md describing the new goals for the pull request.
 *
 * Portugal is final (retired from international football 5 Nov 2026), so only club data is refreshed.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { DATA, ROOT, log, readJson, wikitext, writeJson } from "./lib/util";
import { plain } from "./lib/wikitemplate";
import type { Expected, Goal } from "../lib/schema";

const OUT = path.join(ROOT, ".refresh");

/** Total club goals from the "Career total" row of the club statistics table on Cristiano_Ronaldo. */
export function careerClubTotal(wikitextSrc: string): number {
  // The first "Career total" is the club table (the international table comes later):
  //   !colspan="3"|Career total
  //   !770!!608!!78!!44!! ... !!1,111!!839      <- last cell = club goals
  const i = wikitextSrc.search(/Career total/);
  if (i < 0) throw new Error("Career total row not found");
  const cellsLine = wikitextSrc
    .slice(i)
    .split("\n")
    .slice(1)
    .find((l) => l.includes("!!") || l.includes("||"));
  if (!cellsLine) throw new Error("Could not find the career total cells");
  const cells = plain(cellsLine.replace(/^[!|]/, ""))
    .split(/\s*(?:!!|\|\|)\s*/)
    .map((c) => parseInt(c.replace(/[^\d]/g, ""), 10))
    .filter(Number.isFinite);
  if (!cells.length) throw new Error("Could not parse career total row");
  return cells[cells.length - 1];
}

function run(script: string, ...args: string[]) {
  execFileSync(
    process.execPath,
    [path.join(ROOT, "node_modules", "tsx", "dist", "cli.mjs"), path.join(ROOT, "scripts", script), ...args],
    {
      stdio: "inherit",
    },
  );
}

async function main() {
  const before = readJson<Goal[]>(path.join(DATA, "goals.json"));
  const expected = readJson<Expected>(path.join(DATA, "expected.json"));

  run("fetch-club-recent.ts", "--refresh");
  run("build-dataset.ts");
  run("build-index.ts");

  const after = readJson<Goal[]>(path.join(DATA, "goals.json"));
  const known = new Set(before.map((g) => `${g.date}|${g.team}|${g.minute}`));
  const added = after.filter((g) => !known.has(`${g.date}|${g.team}|${g.minute}`));
  const removed = before.filter(
    (g) => !after.some((a) => a.date === g.date && a.team === g.team && a.minute === g.minute),
  );

  const { text, revid } = await wikitext("Cristiano_Ronaldo", { refresh: true });
  const clubTotal = careerClubTotal(text);
  const wikiTotal = clubTotal + (expected.perTeam.Portugal ?? 146);
  const perTeam: Record<string, number> = {};
  for (const g of after) perTeam[g.team] = (perTeam[g.team] ?? 0) + 1;

  const agrees = after.length === wikiTotal;
  const today = new Date().toISOString().slice(0, 10);
  if (agrees && (added.length || removed.length)) {
    writeJson(path.join(DATA, "expected.json"), {
      ...expected,
      total: after.length,
      perTeam: { ...expected.perTeam, ...perTeam },
      latestGoalDate: after.at(-1)!.date,
      checkedAt: today,
    });
  }

  const lines = [
    added.length ? `## ${added.length} new goal${added.length === 1 ? "" : "s"}` : "## No new goals",
    "",
    ...(added.length
      ? [
          "| # | Date | Team | Opponent | Competition | Minute | Type | Source |",
          "|---|---|---|---|---|---|---|---|",
          ...added.map(
            (g) =>
              `| ${g.n} | ${g.date} | ${g.team} | ${g.opponent} | ${g.competition} | ${g.minute ?? "?"} | ${g.type ?? ""} | ${g.sources.join(", ")} |`,
          ),
        ]
      : []),
    ...(removed.length
      ? ["", `## ⚠️ ${removed.length} goal(s) no longer present`, ...removed.map((g) => `- ${g.id}`)]
      : []),
    "",
    "## Cross-check",
    `- Dataset total: **${after.length}** (was ${before.length})`,
    `- Wikipedia career table (rev ${revid}): ${clubTotal} club + ${expected.perTeam.Portugal} Portugal = **${wikiTotal}**`,
    agrees
      ? added.length || removed.length
        ? "- ✅ Totals agree; `data/expected.json` bumped."
        : "- ✅ Totals agree; nothing to change."
      : "- ❌ Totals disagree. `data/expected.json` NOT bumped, so validation will fail until this is reconciled (check the season article; add or remove rows in `data/manual/club-2022-2026.csv`).",
    "",
    "Review each new goal against a match report before merging.",
  ];
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "pr-body.md"), lines.join("\n") + "\n");
  fs.writeFileSync(path.join(OUT, "changed"), added.length || removed.length ? "true" : "false");
  log("refresh", `added ${added.length}, removed ${removed.length}; dataset ${after.length} vs Wikipedia ${wikiTotal}`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
