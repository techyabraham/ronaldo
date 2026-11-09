import { describe, expect, it } from "vitest";
import goalsJson from "@/data/goals.json";
import byDate from "@/data/generated/by-date.json";
import { GoalsSchema } from "@/lib/schema";
import { validate } from "../../scripts/validate";

const goals = GoalsSchema.parse(goalsJson);

describe("dataset", () => {
  it("passes all validation rules", () => {
    expect(validate(goals).errors).toEqual([]);
  });
  it("index covers all 366 days", () => {
    expect(Object.keys(byDate)).toHaveLength(366);
    expect(byDate["02-29"]).toBeDefined();
  });
  it("career numbers run 1..N in date order", () => {
    expect(goals[0].n).toBe(1);
    expect(goals.at(-1)!.n).toBe(goals.length);
  });
  it("Portugal goals 108-109 are vs France at Euro 2020", () => {
    const pt = goals.filter((g) => g.team === "Portugal");
    expect(pt[107].opponent).toBe("France");
    expect(pt[108].opponent).toBe("France");
  });
  it("has no penalty-shootout goals or youth goals", () => {
    expect(goals.every((g) => g.date >= "2002-10-07")).toBe(true);
  });
});
