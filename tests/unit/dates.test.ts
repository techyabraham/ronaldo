import { describe, expect, it } from "vitest";
import { ALL_MMDD, formatMmdd, isValidMmdd, mmdd } from "@/lib/dates";

describe("dates", () => {
  it("has 366 calendar keys including 29 Feb", () => {
    expect(ALL_MMDD).toHaveLength(366);
    expect(ALL_MMDD).toContain("02-29");
    expect(ALL_MMDD[0]).toBe("01-01");
    expect(ALL_MMDD.at(-1)).toBe("12-31");
  });
  it("rejects impossible dates", () => {
    expect(isValidMmdd("02-30")).toBe(false);
    expect(isValidMmdd("04-31")).toBe(false);
    expect(isValidMmdd("13-01")).toBe(false);
  });
  it("formats", () => {
    expect(formatMmdd("02-05")).toBe("5 February");
    expect(mmdd(7, 2)).toBe("07-02");
  });
});
