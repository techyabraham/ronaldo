import { afterEach, describe, expect, it, vi } from "vitest";
import * as cheerio from "cheerio";
import { changedDates, indexNowPayload, urlsForDates } from "@/scripts/lib/indexnow";

const WWW = "https://www.hasronaldoscoredonyourbirthday.xyz";

/** app/sitemap.ts and lib/site.ts read NEXT_PUBLIC_SITE_URL at import time, so import fresh with it set. */
async function load() {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", WWW);
  return (await import("@/app/sitemap")).default();
}

afterEach(() => vi.unstubAllEnvs());

describe("sitemap.xml", () => {
  it("has 366 dates + 12 month hubs + home, calendar and about, all absolute www without trailing slash", async () => {
    const entries = await load();
    expect(entries).toHaveLength(366 + 12 + 3);
    const urls = entries.map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
    for (const u of urls) {
      expect(u.startsWith(WWW)).toBe(true);
      expect(u).not.toMatch(/\/$/);
    }
    expect(urls).toContain(WWW);
    expect(urls).toContain(`${WWW}/calendar/june`);
    expect(urls).toContain(`${WWW}/birthday/02-29`);
    expect(urls.filter((u) => /\/birthday\/\d{2}-\d{2}$/.test(u))).toHaveLength(366);
  });

  it("leaves out image routes, admin, api and the data download", async () => {
    const urls = (await load()).map((e) => e.url);
    for (const u of urls) expect(u).not.toMatch(/opengraph-image|\/story|\/admin|\/api|goals\.json/);
  });

  it("has a real, valid, non-future lastModified per URL and no priority/changeFrequency", async () => {
    const entries = await load();
    for (const e of entries) {
      const d = e.lastModified as Date;
      expect(d instanceof Date && !Number.isNaN(d.getTime()), e.url).toBe(true);
      expect(d.getTime(), e.url).toBeLessThanOrEqual(Date.now());
      expect(e).not.toHaveProperty("priority");
      expect(e).not.toHaveProperty("changeFrequency");
    }
    // Not one shared build date: pages carry their own content dates.
    expect(new Set(entries.map((e) => (e.lastModified as Date).getTime())).size).toBeGreaterThan(50);
  });
});

describe("video-sitemap.xml (fixture: videos.json is empty today)", async () => {
  const { videoSitemapXml } = await import("@/lib/videoSitemap");
  const page = {
    pageUrl: `${WWW}/birthday/06-23`,
    videos: [
      {
        title: "Cristiano Ronaldo vs France, 2021: 2 goals",
        description: "Cristiano Ronaldo scored 2 goals in Portugal 2–2 France (Euro 2020, 2021) & more <tricky>.",
        thumbnailUrl: "https://i.ytimg.com/vi/AbCdEfGhIjK/hqdefault.jpg",
        embedUrl: "https://www.youtube-nocookie.com/embed/AbCdEfGhIjK",
        uploadDate: "2021-06-24T08:15:00Z",
        realUploadDate: true,
      },
      {
        title: "Cristiano Ronaldo vs Uzbekistan, 2026: 2 goals",
        description: "Fallback date only.",
        thumbnailUrl: "https://i.ytimg.com/vi/ZyXwVuTsRqP/hqdefault.jpg",
        embedUrl: "https://www.youtube-nocookie.com/embed/ZyXwVuTsRqP",
        uploadDate: "2026-06-23T00:00:00Z",
        realUploadDate: false,
      },
    ],
  };

  it("is well-formed XML with one <url> and a <video:video> per saved video", () => {
    const xml = videoSitemapXml([page]);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    const $ = cheerio.load(xml, { xml: true });
    expect($("urlset").attr("xmlns:video")).toBe("http://www.google.com/schemas/sitemap-video/1.1");
    expect($("url")).toHaveLength(1);
    expect($("url > loc").text()).toBe(`${WWW}/birthday/06-23`);
    const vids = $("video\\:video");
    expect(vids).toHaveLength(2);
    expect(vids.first().find("video\\:player_loc").text()).toBe("https://www.youtube-nocookie.com/embed/AbCdEfGhIjK");
    // Escaped in the source, decoded by the parser.
    expect(vids.first().find("video\\:description").text()).toContain("& more <tricky>");
    expect(xml).toContain("&amp; more &lt;tricky&gt;");
    // publication_date only when it is YouTube's real publish time.
    expect(vids.first().find("video\\:publication_date").text()).toBe("2021-06-24T08:15:00Z");
    expect(vids.last().find("video\\:publication_date")).toHaveLength(0);
  });

  it("is an empty, valid <urlset> with no videos", () => {
    const $ = cheerio.load(videoSitemapXml([]), { xml: true });
    expect($("urlset")).toHaveLength(1);
    expect($("url")).toHaveLength(0);
  });
});

describe("IndexNow", () => {
  const g = (id: string, mmdd: string, extra: Record<string, unknown> = {}) => ({ id, mmdd, ...extra });

  it("finds added, removed and edited dates only", () => {
    const before = [g("a", "06-23"), g("b", "05-02"), g("c", "01-01", { minute: "10" })];
    const after = [g("a", "06-23"), g("c", "01-01", { minute: "11" }), g("d", "12-31")];
    expect(changedDates(before, after)).toEqual(["01-01", "05-02", "12-31"]);
    expect(changedDates(before, before)).toEqual([]);
  });

  it("pings each changed date, its month hub, and the pages with live totals", () => {
    const urls = urlsForDates(WWW, ["06-23", "06-30", "12-31"]);
    expect(urls).toEqual([
      WWW,
      `${WWW}/calendar`,
      `${WWW}/calendar/june`,
      `${WWW}/calendar/december`,
      `${WWW}/birthday/06-23`,
      `${WWW}/birthday/06-30`,
      `${WWW}/birthday/12-31`,
      `${WWW}/about`,
    ]);
    expect(urlsForDates(WWW, [])).toEqual([]);
  });

  it("builds the documented payload with the key file at the site root", () => {
    expect(indexNowPayload(WWW, "abc123", [WWW])).toEqual({
      host: "www.hasronaldoscoredonyourbirthday.xyz",
      key: "abc123",
      keyLocation: `${WWW}/abc123.txt`,
      urlList: [WWW],
    });
  });
});
