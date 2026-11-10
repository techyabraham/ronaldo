import { describe, expect, it } from "vitest";
import { ALL_MMDD, formatMmdd } from "@/lib/dates";
import { matchesForDate, pickFamous, summarise } from "@/lib/goals";
import { buildShare, highlightPhrase, xText, xWeightedLength, X_LIMIT, type SharePayload } from "@/lib/share";
import { CREDIT_LINK, CREDIT_X } from "@/lib/site";

const SITE = "https://scoredonmybirthday.com";
const hat = { opponent: "Atletico Madrid", year: 2017, competition: "Champions League", stage: "Semi-final", goals: 3 };
const yes: SharePayload = { kind: "date", count: 12, label: "2 May", highlight: hat, url: `${SITE}/birthday/05-02` };
const no: SharePayload = { kind: "date", count: 0, label: "25 December", url: `${SITE}/birthday/12-25` };
const feb5: SharePayload = {
  kind: "date",
  count: 0,
  label: "5 February",
  hisBirthday: true,
  url: `${SITE}/birthday/02-05`,
};
const invite: SharePayload = { kind: "invite", url: `${SITE}/` };

const decodeX = (href: string) => new URL(href).searchParams.get("text")!;

/** Real payloads for every date (the date's famous match as highlight) and every match on it. */
function allPayloads(): SharePayload[] {
  const out: SharePayload[] = [];
  for (const mmdd of ALL_MMDD) {
    const s = summarise(mmdd);
    const ms = matchesForDate(mmdd);
    const f = ms.length ? pickFamous(ms) : null;
    const label = formatMmdd(mmdd);
    const url = `${SITE}/birthday/${mmdd}`;
    out.push({
      kind: "date",
      count: s.count,
      label,
      hisBirthday: mmdd === "02-05",
      url,
      highlight: f
        ? { opponent: f.opponent, year: f.year, competition: f.competition, stage: f.stage, goals: f.goals.length }
        : null,
    });
    for (const m of ms) {
      out.push({
        kind: "goal",
        label,
        url: `${url}#m-${m.matchId}`,
        match: {
          team: m.team,
          opponent: m.opponent,
          year: m.year,
          competition: m.competition,
          stage: m.stage,
          goals: m.goals.length,
        },
      });
    }
  }
  return out;
}

describe("share messages", () => {
  it("yes: brags with the day's best match", () => {
    expect(buildShare(yes).message).toBe(
      "Ronaldo scored 12 goals on my birthday (2 May), including a hat-trick vs Atletico Madrid in the 2017 Champions League semi-final 🐐 Has he scored on yours? 👇",
    );
  });
  it("no: names Ronaldo, GOAT as the accent", () => {
    expect(buildShare(no).message).toBe(
      "Ronaldo has never scored on my birthday (25 December) 😅 Even the GOAT takes a day off. Has he scored on yours? 👇",
    );
  });
  it("5 Feb: shared-birthday prefix", () => {
    expect(buildShare(feb5).message).toBe(
      "I share a birthday with Cristiano Ronaldo 🎂 Ronaldo has never scored on my birthday (5 February) 😅 Even the GOAT takes a day off. Has he scored on yours? 👇",
    );
  });
  it("invite", () => {
    expect(buildShare(invite).message).toBe(
      "Has Ronaldo scored on your birthday? 🐐 I just checked mine. Check yours 👇",
    );
  });
  it("goal", () => {
    const g: SharePayload = {
      kind: "goal",
      label: "15 June",
      url: `${SITE}/birthday/06-15#m-2018-06-15-spain`,
      match: {
        team: "Portugal",
        opponent: "Spain",
        year: 2018,
        competition: "World Cup",
        stage: "Group stage",
        goals: 3,
      },
    };
    expect(buildShare(g).message).toBe(
      "Watch Ronaldo's hat-trick vs Spain (2018). He did it on my birthday 🐐 Check yours 👇",
    );
  });
  it("plain is message, url, blank line, credit", () => {
    expect(buildShare(yes).plain).toBe(`${buildShare(yes).message}\n${yes.url}\n\n${CREDIT_LINK}`);
  });
});

describe("X", () => {
  it("ends with the creator signature, carries the URL, no url/via params", () => {
    const { links } = buildShare(yes);
    const text = decodeX(links.x);
    expect(text.endsWith(`\n\n${CREDIT_X}`)).toBe(true);
    expect(CREDIT_X).toBe("Created by @AkinwumiX");
    expect(text).toContain(yes.url);
    expect(links.x).not.toMatch(/[?&](url|via)=/);
    expect(text).toContain("#Ronaldo");
  });
  it("counts weight like X: URLs are 23, emoji 2", () => {
    expect(xWeightedLength("https://example.com/a/very/long/path?with=query")).toBe(23);
    expect(xWeightedLength("ab🐐")).toBe(4);
    expect(xWeightedLength("—")).toBe(1);
  });
  it("every date and every single-goal share fits in 280", () => {
    const payloads = allPayloads();
    expect(payloads.length).toBeGreaterThan(366);
    for (const p of payloads) {
      const text = decodeX(buildShare(p).links.x);
      expect(xWeightedLength(text), text).toBeLessThanOrEqual(X_LIMIT);
      expect(text.endsWith(CREDIT_X)).toBe(true);
    }
  });
  it("falls back by dropping #Ronaldo, then shortening, then dropping the highlight, never the credit", () => {
    const full = xText(yes);
    const noTag = xText(yes, xWeightedLength(full) - 1);
    expect(noTag).not.toContain("#Ronaldo");
    expect(noTag).toContain(highlightPhrase(hat));
    const short = xText(yes, xWeightedLength(noTag) - 1);
    expect(short).toContain("a hat-trick vs Atletico Madrid in 2017");
    expect(short).not.toContain("semi-final");
    const none = xText(yes, xWeightedLength(short) - 1);
    expect(none).not.toContain("including");
    for (const t of [noTag, short, none]) expect(t.endsWith(`\n\n${CREDIT_X}`)).toBe(true);
  });
});

describe("other channels", () => {
  const { links, plain } = buildShare(yes);
  const decodedParam = (href: string, key: string) => new URL(href).searchParams.get(key)!;

  it("WhatsApp, Threads and plain end with the credit link, site URL first", () => {
    for (const t of [decodedParam(links.whatsapp, "text"), decodedParam(links.threads, "text"), plain]) {
      expect(t.endsWith(CREDIT_LINK)).toBe(true);
      expect(CREDIT_LINK).toBe("Made by Abraham Akinwumi: https://x.com/AkinwumiX");
      expect(t.indexOf(yes.url)).toBeGreaterThanOrEqual(0);
      expect(t.indexOf(yes.url)).toBeLessThan(t.indexOf("https://x.com/AkinwumiX"));
    }
  });
  it("Telegram previews our page and credits in the text", () => {
    expect(decodedParam(links.telegram, "url")).toBe(yes.url);
    expect(decodedParam(links.telegram, "text").endsWith(CREDIT_LINK)).toBe(true);
  });
  it("Facebook only takes the URL", () => {
    expect(links.facebook).toBe(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(yes.url)}`);
  });
});
