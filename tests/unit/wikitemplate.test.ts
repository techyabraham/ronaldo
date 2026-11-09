import { describe, expect, it } from "vitest";
import { findTemplates, plain, splitTop } from "../../scripts/lib/wikitemplate";
import { fixMojibake, normOpponent, normType } from "../../scripts/lib/normalize";

describe("wikitext helpers", () => {
  it("splits on top-level pipes only", () => {
    expect(splitTop("a|[[b|c]]|{{d|e}}")).toEqual(["a", "[[b|c]]", "{{d|e}}"]);
  });
  it("extracts football boxes with nested templates", () => {
    const t = `x {{Football box collapsible
|date = 29 October 2026
|team1 = Al-Nassr
|goals1 = [[Cristiano Ronaldo|Ronaldo]] {{goal|66||72||81}}
}} y`;
    const [b] = findTemplates(t, /^football box/i);
    expect(b.params.date).toBe("29 October 2026");
    expect(b.params.goals1).toContain("{{goal|66||72||81}}");
  });
  it("plain-texts links", () => {
    expect(plain("[[Al-Kholood Club|Al-Kholood]]")).toBe("Al-Kholood");
  });
});

describe("normalisation", () => {
  it("repairs mojibake", () => {
    expect(fixMojibake("Deportivo de La CoruÃ±a")).toBe("Deportivo de La Coruña");
  });
  it("maps opponents", () => {
    expect(normOpponent("Atletico de Madrid")).toBe("Atletico Madrid");
    expect(normOpponent("Chelsea FC")).toBe("Chelsea");
  });
  it("maps goal types", () => {
    expect(normType("Direct free kick")).toBe("free-kick");
    expect(normType("Penalty rebound")).toBe("open-play");
    expect(normType("")).toBeNull();
  });
});
