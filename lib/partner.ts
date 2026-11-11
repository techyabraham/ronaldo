/**
 * The site's one sponsor. Every banner reads its copy, link and colours from here; nothing partner-related is
 * hard-coded anywhere else. Set NEXT_PUBLIC_PARTNER=off at build time to remove every banner.
 */
export const PARTNER = {
  enabled: process.env.NEXT_PUBLIC_PARTNER !== "off", // on by default; set "off" in Vercel to remove every banner
  name: "SkillsAir",
  label: "SPONSORED",
  baseUrl: "https://skillsair.com/",
  referral: { skr: "WH22F793" }, // MUST be kept on every link (referral credit)
  headline: { before: "Start a ", highlight: "true job-ready tech scholarship", after: " program" },
  headlineSuffix: " with SkillsAir", // used on the home + result variants, not the strip
  benefit: "Internship placement when you graduate",
  cta: "Apply now",
  color: {
    bg: "#0d1b4b",
    border: "#22336e",
    chip: "#16265f",
    accent: "#f97316", // orange: "Air", highlight words, CTA background
    onAccent: "#0d1b4b", // CTA text/icon
    text: "#ffffff",
    body: "#d6dcf2",
    soft: "#e6eaf7",
    label: "#b3bde0",
    check: "#5fe39a",
    star: "#ffd600",
    bag: "#ff8a7a",
    logo: ["#339900", "#FFD600", "#D50000"], // the three bars of the SkillsAir mark, top to bottom
  },
} as const;

export type PartnerPlacement =
  "home" | "loading" | "result-yes" | "result-no" | "calendar" | "about" | "month" | "not-found";

/** https://skillsair.com/?skr=WH22F793&utm_source=ronaldo&utm_medium=banner&utm_campaign=<placement>[&utm_content=<slot>] */
export function partnerHref(placement: PartnerPlacement, slot?: number): string {
  const url = new URL(PARTNER.baseUrl);
  const q = new URLSearchParams();
  q.set("skr", PARTNER.referral.skr); // referral code first, always
  q.set("utm_source", "ronaldo");
  q.set("utm_medium", "banner");
  q.set("utm_campaign", placement);
  if (slot !== undefined) q.set("utm_content", String(slot));
  url.search = q.toString();
  return url.toString();
}

const NEW_TAB = " Opens skillsair.com in a new tab.";
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const headlineText = (suffix: boolean) =>
  `${PARTNER.headline.before}${PARTNER.headline.highlight}${PARTNER.headline.after}${suffix ? PARTNER.headlineSuffix : ""}`;

/** The accessible name of each banner variant (the reference designs' aria-label + a new-tab note). */
export function partnerAriaLabel(variant: "banner" | "strip" | "card"): string {
  const benefit = `Get ${lowerFirst(PARTNER.benefit)}.`;
  if (variant === "strip") {
    return `Sponsored by ${PARTNER.name}: ${lowerFirst(headlineText(false))}. ${benefit}${NEW_TAB}`;
  }
  return `${headlineText(true)}. ${benefit} ${PARTNER.cta}.${NEW_TAB}`;
}
