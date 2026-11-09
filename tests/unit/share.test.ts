import { describe, expect, it } from "vitest";
import { highlightPhrase, shareLinks, shareText } from "@/lib/share";

describe("share text", () => {
  const hat = {
    opponent: "Atletico Madrid",
    year: 2017,
    competition: "Champions League",
    stage: "Semi-final",
    goals: 3,
  };

  it("brags with the best goal on yes days", () => {
    expect(shareText({ count: 12, label: "2 May", highlight: hat })).toBe(
      "Ronaldo scored 12 goals on my birthday (2 May), including a hat-trick vs Atletico Madrid in the 2017 Champions League semi-final 🐐 Did he score on yours? 👇",
    );
  });
  it("provokes curiosity on no days", () => {
    expect(shareText({ count: 0, label: "25 December" })).toBe(
      "Ronaldo has NEVER scored on my birthday (25 December) 😅 Did he score on yours? 👇",
    );
  });
  it("mentions the shared birthday on 5 Feb", () => {
    expect(shareText({ count: 0, label: "5 February", hisBirthday: true })).toMatch(
      /^I share a birthday with Cristiano/,
    );
  });
  it("uses plain wording for league games", () => {
    expect(highlightPhrase({ opponent: "Abha", year: 2026, competition: "Saudi Pro League", goals: 1 })).toBe(
      "a goal vs Abha in 2026",
    );
  });
  it("builds share links with text and url", () => {
    const l = shareLinks("hi 🐐", "https://x.test/birthday/05-02");
    expect(decodeURIComponent(l.whatsapp)).toBe("https://wa.me/?text=hi 🐐 https://x.test/birthday/05-02");
    expect(l.telegram).toContain("t.me/share/url?url=https%3A%2F%2Fx.test%2Fbirthday%2F05-02");
  });
});
