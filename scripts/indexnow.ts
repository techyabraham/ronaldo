/**
 * Tell IndexNow (Bing, Yandex, Seznam, Naver…; Bing also feeds Copilot and ChatGPT search) which pages changed
 * after a data refresh.
 *
 *   npx tsx scripts/indexnow.ts [--base <git ref>] [--dry-run] [--wait]
 *
 * - Diffs data/goals.json between --base (default HEAD~1) and the working tree to find the changed MM-DDs.
 * - --wait polls the live /data/goals.json until it matches the local goal count (the deploy is live) before pinging.
 * - --dry-run prints the payload and sends nothing. Without INDEXNOW_KEY it is always a dry run.
 * - Only ever pings the production www origin. Run from .github/workflows/indexnow.yml on pushes to master.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { changedDates, indexNowPayload, urlsForDates } from "./lib/indexnow";

const SITE = "https://www.hasronaldoscoredonyourbirthday.xyz";
const ENDPOINT = "https://api.indexnow.org/indexnow";
const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const opt = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

type Goal = { id: string; mmdd: string } & Record<string, unknown>;

function goalsAt(ref: string): Goal[] | null {
  if (/^0+$/.test(ref)) return null; // GitHub's "before" for a brand-new branch
  try {
    const out = execFileSync("git", ["show", `${ref}:data/goals.json`], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 64e6,
      stdio: ["ignore", "pipe", "ignore"],
    });
    return JSON.parse(out);
  } catch {
    return null;
  }
}

async function waitForDeploy(expected: number) {
  const deadline = Date.now() + 20 * 60_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${SITE}/data/goals.json`, { cache: "no-store" });
      if (res.ok && ((await res.json()) as unknown[]).length === expected) return true;
    } catch {
      // not live yet
    }
    console.log(`Waiting for the deploy to serve ${expected} goals…`);
    await new Promise((r) => setTimeout(r, 30_000));
  }
  return false;
}

async function main() {
  const base = opt("--base") ?? "HEAD~1";
  const after: Goal[] = JSON.parse(fs.readFileSync(path.join(ROOT, "data/goals.json"), "utf8"));
  const before = goalsAt(base);
  if (!before) {
    console.log(`No data/goals.json at ${base}; nothing to compare. Skipping.`);
    return;
  }
  const dates = changedDates(before, after);
  const urlList = urlsForDates(SITE, dates);
  if (!urlList.length) {
    console.log("No date pages changed. Nothing to ping.");
    return;
  }

  const key = process.env.INDEXNOW_KEY ?? "";
  const keyFile = path.join(ROOT, "public", `${key}.txt`);
  const dry = flag("--dry-run") || !key;
  if (key && (!fs.existsSync(keyFile) || fs.readFileSync(keyFile, "utf8").trim() !== key)) {
    throw new Error(`public/${key}.txt must exist and contain the key (IndexNow fetches it to verify ownership).`);
  }

  const payload = indexNowPayload(SITE, key || "<INDEXNOW_KEY>", urlList);
  console.log(`Changed dates: ${dates.join(", ")}`);
  console.log(JSON.stringify(payload, null, 2));
  if (dry) {
    console.log(key ? "Dry run: nothing sent." : "INDEXNOW_KEY is not set: dry run, nothing sent.");
    return;
  }

  if (flag("--wait") && !(await waitForDeploy(after.length))) {
    throw new Error("The live site never served the new data; not pinging stale pages.");
  }
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  // 200 = accepted, 202 = accepted (key validation pending). Anything else is an error.
  console.log(`IndexNow: ${res.status} ${res.statusText}`);
  if (res.status !== 200 && res.status !== 202) {
    throw new Error(`IndexNow rejected the request: ${res.status} ${await res.text()}`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
