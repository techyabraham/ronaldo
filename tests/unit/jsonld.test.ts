import { describe, expect, it } from "vitest";
import { ALL_MMDD } from "@/lib/dates";
import type { Match } from "@/lib/goals";
import {
  PERSON_CR7_ID,
  WEBSITE_ID,
  aboutGraph,
  calendarGraph,
  dateGraph,
  graph,
  monthGraph,
  siteGraph,
  videoObject,
  type Graph,
  type Node,
} from "@/lib/jsonld";

const nodes = (g: Graph, type: string) => g["@graph"].filter((n) => n["@type"] === type);
const one = (g: Graph, type: string) => {
  const ns = nodes(g, type);
  expect(ns, type).toHaveLength(1);
  return ns[0] as Record<string, unknown>;
};

/** Fails on any undefined or null anywhere in the tree (JSON.stringify would silently drop/keep them). */
function assertNoEmpty(v: unknown, path = "$") {
  expect(v, path).not.toBeUndefined();
  expect(v, path).not.toBeNull();
  if (Array.isArray(v)) v.forEach((x, i) => assertNoEmpty(x, `${path}[${i}]`));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) assertNoEmpty(x, `${path}.${k}`);
}

function assertBreadcrumb(b: Record<string, unknown>) {
  const items = b.itemListElement as { position: number; item: string; name: string }[];
  expect(items.map((i) => i.position)).toEqual(items.map((_, i) => i + 1));
  for (const i of items) expect(i.item).toMatch(/^https?:\/\//);
}

const builders: [string, () => Graph][] = [
  ["site", siteGraph],
  ["date yes 06-23", () => dateGraph("06-23")],
  ["date no 02-16", () => dateGraph("02-16")],
  ["calendar", calendarGraph],
  ["month june", () => monthGraph(6)],
  ["month july", () => monthGraph(7)],
  ["about", () => aboutGraph()],
  ["about + download", () => aboutGraph({ downloadUrl: "https://example.test/data/goals.json" })],
];

describe("JSON-LD builders", () => {
  it.each(builders)("%s: parses, has @context, no null/undefined", (_, build) => {
    const g = build();
    const round = JSON.parse(JSON.stringify(g));
    expect(round["@context"]).toBe("https://schema.org");
    expect(round).toEqual(g);
    assertNoEmpty(g);
    for (const n of g["@graph"]) expect(n["@type"]).toBeTruthy();
  });

  it("site graph: WebSite with alternate names, creator and Cristiano Ronaldo, no search action", () => {
    const g = siteGraph();
    const site = one(g, "WebSite");
    expect(site["@id"]).toBe(WEBSITE_ID);
    expect(site.alternateName).toContain("Has Ronaldo Scored On Your Birthday");
    expect(site).not.toHaveProperty("potentialAction");
    expect(nodes(g, "Person").map((p) => p.name)).toEqual(["Abraham Akinwumi", "Cristiano Ronaldo"]);
  });

  it("every date page: ItemPage + breadcrumb Home / Calendar / Month / Date with positions 1..N", () => {
    for (const mmdd of ALL_MMDD) {
      const g = dateGraph(mmdd);
      const page = one(g, "ItemPage");
      expect(page.about).toEqual({ "@id": PERSON_CR7_ID });
      expect(page.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const b = one(g, "BreadcrumbList");
      assertBreadcrumb(b);
      expect((b.itemListElement as { name: string }[]).map((i) => i.name).slice(0, 2)).toEqual(["Home", "Calendar"]);
    }
  });

  it("scoring dates list their matches; rest days don't", () => {
    const yes = one(dateGraph("06-23"), "ItemList");
    expect(yes.name).toBe("Cristiano Ronaldo's goals on 23 June");
    expect(yes.numberOfItems).toBe(2);
    const items = yes.itemListElement as { name: string; url: string }[];
    expect(items.map((i) => i.name)).toContain("Portugal 2–2 France (Euro 2020, 2021)");
    for (const i of items) expect(i.url).toMatch(/\/birthday\/06-23#m-/);
    expect(nodes(dateGraph("02-16"), "ItemList")).toHaveLength(0);
  });

  it("no SportsEvent, FAQPage or HowTo anywhere", () => {
    for (const [, build] of builders) {
      const types = build()["@graph"].map((n) => n["@type"]);
      expect(types).not.toContain("SportsEvent");
      expect(types).not.toContain("FAQPage");
      expect(types).not.toContain("HowTo");
    }
  });

  it("calendar lists the 12 month hubs", () => {
    const list = one(calendarGraph(), "ItemList");
    expect(list.numberOfItems).toBe(12);
    expect((list.itemListElement as { url: string }[])[5].url).toMatch(/\/calendar\/june$/);
  });

  it("month hubs: CollectionPage, Home / Calendar / Month breadcrumb, ItemList of that month's scoring dates", () => {
    for (let m = 1; m <= 12; m++) {
      const g = monthGraph(m);
      one(g, "CollectionPage");
      const b = one(g, "BreadcrumbList");
      assertBreadcrumb(b);
      expect((b.itemListElement as unknown[]).length).toBe(3);
      const list = one(g, "ItemList");
      const urls = (list.itemListElement as { url: string }[]).map((i) => i.url);
      const prefix = String(m).padStart(2, "0");
      for (const u of urls) expect(u).toMatch(new RegExp(`/birthday/${prefix}-\\d{2}$`));
      expect(list.numberOfItems).toBe(urls.length);
    }
  });

  it("about: Dataset with licence, sources, coverage; distribution only when the file is published", () => {
    const d = one(aboutGraph(), "Dataset");
    expect(d.license).toBe("https://opendatacommons.org/licenses/odbl/1-0/");
    expect(d.temporalCoverage).toMatch(/^2002-10-07\/\d{4}-\d{2}-\d{2}$/);
    expect(d.isBasedOn).toHaveLength(2);
    expect(String(d.description).length).toBeGreaterThanOrEqual(50);
    expect(d).not.toHaveProperty("distribution");
    const withFile = one(aboutGraph({ downloadUrl: "https://example.test/data/goals.json" }), "Dataset");
    expect(withFile.distribution).toMatchObject({ "@type": "DataDownload", encodingFormat: "application/json" });
  });
});

describe("VideoObject (fixture: videos.json is empty today)", () => {
  const base: Match = {
    matchId: "2021-06-23-france",
    date: "2021-06-23",
    year: 2021,
    team: "Portugal",
    opponent: "France",
    competition: "European Championship",
    venue: "N",
    result: "2-2",
    goals: [
      { id: "a", n: 108, minute: "31", type: "penalty", scoreAfter: "1-0", notes: undefined },
      { id: "b", n: 109, minute: "60", type: "penalty", scoreAfter: "2-1", notes: undefined },
    ],
    video: { youtubeId: "AbCdEfGhIjK", status: "verified", publishedAt: "2021-06-24T08:15:00Z" },
  };
  const url = "https://www.hasronaldoscoredonyourbirthday.xyz/birthday/06-23";

  it("has every required field, plus embedUrl and the match anchor", () => {
    const v = videoObject(url, base)! as Record<string, unknown>;
    expect(v["@type"]).toBe("VideoObject");
    expect(v.name).toBe("Cristiano Ronaldo vs France, 2021: 2 goals");
    expect(v.thumbnailUrl).toEqual(["https://i.ytimg.com/vi/AbCdEfGhIjK/hqdefault.jpg"]);
    expect(v.uploadDate).toBe("2021-06-24T08:15:00Z");
    expect(v.embedUrl).toBe("https://www.youtube-nocookie.com/embed/AbCdEfGhIjK");
    expect(v.url).toBe(`${url}#m-2021-06-23-france`);
    expect(String(v.description)).toContain("Portugal 2–2 France (Euro 2020, 2021)");
    assertNoEmpty(graph(v as Node));
  });

  it("falls back to the match date (with time zone) when publishedAt is missing", () => {
    const v = videoObject(url, { ...base, video: { youtubeId: "AbCdEfGhIjK", status: "auto" } })!;
    expect(v.uploadDate).toBe("2021-06-23T00:00:00Z");
    expect(String(v.uploadDate)).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/);
  });

  it("emits nothing for a match without a saved video", () => {
    expect(videoObject(url, { ...base, video: null })).toBeNull();
  });
});
