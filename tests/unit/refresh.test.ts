import { describe, expect, it } from "vitest";
import { careerClubTotal } from "../../scripts/refresh";

describe("careerClubTotal", () => {
  it("reads club goals from the Career total row", () => {
    const src = `|-
!colspan="2"|Total
!117!!110!!8!!3!!0!!0!!23!!16!!12!!9!!160!!138
|-
!colspan="3"|Career total
!770!!608!!78!!44!!12!!4!!218!!159!!33!!24!!1,111!!839
|}`;
    expect(careerClubTotal(src)).toBe(839);
  });
});
