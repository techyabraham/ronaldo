import { describe, expect, it } from "vitest";
import { buildQuery, opponentTokens, pickBest, type MatchInfo, type SearchItem } from "../../scripts/lib/youtube";

const m: MatchInfo = {
  matchId: "2026-10-29-al-kholood",
  date: "2026-10-29",
  team: "Al Nassr",
  opponent: "Al-Kholood",
  competition: "Saudi Pro League",
  goals: 3,
};
const item = (title: string, channelTitle = "Some Channel", publishedAt = "2026-10-30T10:00:00Z"): SearchItem => ({
  id: { videoId: "abcdefghijk" },
  snippet: { title, channelId: "UCx", channelTitle, publishedAt },
});

describe("youtube scoring", () => {
  it("builds per-match queries", () => {
    expect(buildQuery(m)).toBe("Cristiano Ronaldo goal Al-Kholood Al Nassr 2026");
    expect(buildQuery({ ...m, stage: "Final", competition: "Champions League" })).toContain("Champions League final");
  });
  it("tokenises opponents", () => {
    expect(opponentTokens("Atletico Madrid")).toEqual(["atletico"]);
    expect(opponentTokens("Al-Kholood")).toEqual(["kholood"]);
  });
  it("prefers official, recent, specific uploads and rejects compilations", () => {
    const best = pickBest(
      [
        item("Top 10 Ronaldo goals vs Saudi teams compilation"),
        item("Cristiano Ronaldo hat-trick vs Al Kholood | Highlights", "Roshn Saudi League"),
      ],
      m,
    );
    expect(best?.ok).toBe(true);
    expect(best?.it.snippet.title).toContain("hat-trick");
  });
  it("does not accept a video that doesn't name the opponent", () => {
    expect(pickBest([item("Cristiano Ronaldo amazing goal 2026", "Roshn Saudi League")], m)?.ok).toBe(false);
  });
});
