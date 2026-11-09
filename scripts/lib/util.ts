import fs from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(__dirname, "..", "..");
export const DATA = path.join(ROOT, "data");
export const RAW = path.join(DATA, "raw");
export const CACHE = path.join(RAW, "cache");

const UA = "DidRonaldoScoreOnMyBirthday/1.0 (unofficial fan project; data pipeline)";

export function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

export function writeJson(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

export function log(scope: string, ...msg: unknown[]) {
  console.log(`[${scope}]`, ...msg);
}

/** Fetch a URL once and cache the body on disk; re-runs cost zero requests. */
export async function fetchCached(url: string, cacheName: string, opts: { refresh?: boolean } = {}) {
  const file = path.join(CACHE, cacheName);
  if (!opts.refresh && fs.existsSync(file)) return fs.readFileSync(file, "utf8");
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  const body = await res.text();
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(file, body);
  return body;
}

/** Wikitext of a Wikipedia page via the MediaWiki API (cached). */
export async function wikitext(page: string, opts: { refresh?: boolean } = {}) {
  const url =
    "https://en.wikipedia.org/w/api.php?action=parse&prop=wikitext|revid&format=json&formatversion=2&redirects=1&page=" +
    encodeURIComponent(page);
  const body = await fetchCached(url, `wiki-${slug(page)}.json`, opts);
  const json = JSON.parse(body) as { parse?: { wikitext: string; revid: number }; error?: { info: string } };
  if (!json.parse) throw new Error(`Wikipedia: ${page}: ${json.error?.info}`);
  return { text: json.parse.wikitext, revid: json.parse.revid };
}

/** Rendered HTML of a Wikipedia page via the MediaWiki API (cached). */
export async function wikiHtml(page: string, opts: { refresh?: boolean } = {}) {
  const url =
    "https://en.wikipedia.org/w/api.php?action=parse&prop=text|revid&format=json&formatversion=2&redirects=1&page=" +
    encodeURIComponent(page);
  const body = await fetchCached(url, `wiki-html-${slug(page)}.json`, opts);
  const json = JSON.parse(body) as { parse?: { text: string; revid: number }; error?: { info: string } };
  if (!json.parse) throw new Error(`Wikipedia: ${page}: ${json.error?.info}`);
  return { html: json.parse.text, revid: json.parse.revid };
}

export function slug(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

/** "12 June 2004" -> "2004-06-12" */
export function parseDmy(s: string): string {
  const m = s.trim().match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!m) throw new Error(`Unparseable date: "${s}"`);
  const mi = MONTHS.indexOf(m[2].toLowerCase());
  if (mi < 0) throw new Error(`Unknown month in "${s}"`);
  return `${m[3]}-${String(mi + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

export function hasFlag(name: string) {
  return process.argv.includes(name);
}
