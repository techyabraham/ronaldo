/**
 * Live crawl-hygiene check against the deployed site. Run by hand after a deploy or a Vercel domain change:
 *   npx tsx scripts/check-live-seo.ts [origin]
 * Prints a pass/fail table and exits 1 if any row fails. Not part of CI (it hits the real site).
 */
function printTable(header: string[], rows: string[][]) {
  const w = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
  const line = (r: string[]) => r.map((c, i) => c.padEnd(w[i])).join("  ");
  console.log(line(header));
  console.log(w.map((n) => "-".repeat(n)).join("  "));
  for (const r of rows) console.log(line(r));
}

const WWW = (process.argv[2] ?? "https://www.hasronaldoscoredonyourbirthday.xyz").replace(/\/$/, "");
const host = new URL(WWW).host;
const APEX = `https://${host.replace(/^www\./, "")}`;

type Row = { check: string; url: string; expected: string; got: string; pass: boolean };

async function head(url: string) {
  const res = await fetch(url, { redirect: "manual", headers: { "user-agent": "goat-day-seo-check" } });
  return { status: res.status, location: res.headers.get("location") ?? "", text: () => res.text() };
}

const isRedirect = (s: number) => [301, 302, 307, 308].includes(s);
const isPermanent = (s: number) => s === 301 || s === 308;
/** Location may be relative; resolve it against the request URL. */
const resolve = (loc: string, base: string) => (loc ? new URL(loc, base).toString() : "");

async function main() {
  const rows: Row[] = [];
  const add = (check: string, url: string, expected: string, got: string, pass: boolean) =>
    rows.push({ check, url, expected, got, pass });

  {
    const url = `${APEX}/`;
    const r = await head(url);
    const to = resolve(r.location, url);
    add(
      "apex → www",
      url,
      `301/308 → ${WWW}/`,
      `${r.status} → ${to || "-"}`,
      isPermanent(r.status) && to === `${WWW}/`,
    );
  }
  {
    const url = `${WWW.replace(/^https:/, "http:")}/`;
    const r = await head(url);
    const to = resolve(r.location, url);
    add(
      "http → https",
      url,
      `redirect → ${WWW}/`,
      `${r.status} → ${to || "-"}`,
      isRedirect(r.status) && to === `${WWW}/`,
    );
  }
  {
    const url = `${WWW}/birthday/06-23/`;
    const r = await head(url);
    const to = resolve(r.location, url);
    const want = `${WWW}/birthday/06-23`;
    add("trailing slash", url, `308 → ${want}`, `${r.status} → ${to || "-"}`, r.status === 308 && to === want);
  }
  {
    const url = `${WWW}/birthday/13-40`;
    const r = await head(url);
    const body = await r.text();
    const ok = r.status === 404 && /Off target/i.test(body) && /noindex/i.test(body);
    add(
      "unknown date",
      url,
      "404 + not-found page + noindex",
      `${r.status}${/Off target/i.test(body) ? " + page" : ""}`,
      ok,
    );
  }
  for (const p of ["/robots.txt", "/sitemap.xml"]) {
    const url = `${WWW}${p}`;
    const r = await head(url);
    add(p, url, "200", String(r.status), r.status === 200);
  }
  {
    const url = `${WWW}/robots.txt`;
    const body = await (await head(url)).text();
    const ok = /Allow: \//.test(body) && !/Disallow: \/\s*$/m.test(body) && body.includes(`${WWW}/sitemap.xml`);
    add("robots allows crawling", url, "Allow: / + sitemap", ok ? "ok" : "blocked or no sitemap", ok);
  }

  printTable(
    ["", "check", "expected", "got"],
    rows.map((r) => [r.pass ? "PASS" : "FAIL", r.check, r.expected, r.got]),
  );
  const failed = rows.filter((r) => !r.pass).length;
  console.log(failed ? `\n${failed} check(s) failed.` : "\nAll checks passed.");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
