import { describe, expect, it } from "vitest";
import { INVITE_TEXT, highlightPhrase, shareLinks, shareText } from "@/lib/share";

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
      "The GOAT scored 12 goals on my birthday (2 May), including a hat-trick vs Atletico Madrid in the 2017 Champions League semi-final 🐐 Is yours a GOAT Day? 👇",
    );
  });
  it("provokes curiosity on no days", () => {
    expect(shareText({ count: 0, label: "25 December" })).toBe(
      "Even the GOAT takes a day off: Ronaldo has never scored on my birthday (25 December) 😅 Is yours a GOAT Day? 👇",
    );
  });
  it("mentions the shared birthday on 5 Feb", () => {
    expect(shareText({ count: 0, label: "5 February", hisBirthday: true })).toMatch(
      /^I share a birthday with the GOAT 🎂 Even the GOAT takes a day off/,
    );
  });
  it("invites without a result", () => {
    expect(INVITE_TEXT).toBe("Did the GOAT score on your birthday? 🐐 I just checked mine. Is yours a GOAT Day? 👇");
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
