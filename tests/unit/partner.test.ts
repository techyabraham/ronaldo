import { afterEach, describe, expect, it, vi } from "vitest";
import { type PartnerPlacement, partnerAriaLabel, partnerHref } from "@/lib/partner";

const BASE = "https://skillsair.com/?skr=WH22F793&utm_source=ronaldo&utm_medium=banner&utm_campaign=";

describe("partnerHref", () => {
  const placements: PartnerPlacement[] = [
    "home",
    "loading",
    "result-yes",
    "result-no",
    "calendar",
    "about",
    "month",
    "not-found",
  ];

  it.each(placements)("%s: exact link, referral code first", (p) => {
    const href = partnerHref(p);
    expect(href).toBe(`${BASE}${p}`);
    expect(new URL(href).search.startsWith("?skr=WH22F793&")).toBe(true);
  });

  it("home matches the approved string", () => {
    expect(partnerHref("home")).toBe(
      "https://skillsair.com/?skr=WH22F793&utm_source=ronaldo&utm_medium=banner&utm_campaign=home",
    );
  });

  it("calendar slots add utm_content last", () => {
    expect(partnerHref("calendar", 1)).toBe(`${BASE}calendar&utm_content=1`);
    expect(partnerHref("calendar", 6)).toBe(`${BASE}calendar&utm_content=6`);
    expect(partnerHref("month", 12)).toBe(`${BASE}month&utm_content=12`);
  });
});

describe("partnerAriaLabel", () => {
  it("matches the reference designs plus a new-tab note", () => {
    expect(partnerAriaLabel("banner")).toBe(
      "Start a true job-ready tech scholarship program with SkillsAir. Get internship placement when you graduate. Apply now. Opens skillsair.com in a new tab.",
    );
    expect(partnerAriaLabel("strip")).toBe(
      "Sponsored by SkillsAir: start a true job-ready tech scholarship program. Get internship placement when you graduate. Opens skillsair.com in a new tab.",
    );
  });
});

describe("PARTNER.enabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("is true by default", async () => {
    vi.stubEnv("NEXT_PUBLIC_PARTNER", undefined);
    vi.resetModules();
    expect((await import("@/lib/partner")).PARTNER.enabled).toBe(true);
  });

  it('is false when NEXT_PUBLIC_PARTNER="off"', async () => {
    vi.stubEnv("NEXT_PUBLIC_PARTNER", "off");
    vi.resetModules();
    expect((await import("@/lib/partner")).PARTNER.enabled).toBe(false);
  });
});
