export const SITE_NAME = "GOAT Day";
export const SITE_TAGLINE = "Has Ronaldo scored on your birthday?";

/** The person who designed and built the site. Use these constants, never literals. */
export const CREATOR = {
  name: "Abraham Akinwumi",
  handle: "AkinwumiX",
  xUrl: "https://x.com/AkinwumiX",
  portfolioUrl: "https://abraham.com.ng",
} as const;
/** Signature on every X share (last line of the post). */
export const CREDIT_X = `Created by @${CREATOR.handle}`;
/** Signature on every other share: the site link comes first, this goes after it. */
export const CREDIT_LINK = `Made by ${CREATOR.name}: ${CREATOR.xUrl}`;

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ??
  "http://localhost:3000"
).replace(/\/$/, "");

export const CORRECTIONS_URL = "https://github.com/techyabraham/ronaldo/issues/new?template=correction.md";

export const DISCLAIMER =
  "Unofficial fan site. Not affiliated with Cristiano Ronaldo, his clubs, or any league. Videos are embedded from YouTube and belong to their owners.";

export const KEYWORDS = [
  "Cristiano Ronaldo",
  "Ronaldo birthday goal",
  "did Ronaldo score on my birthday",
  "Has Ronaldo scored on my birthday",
  "Christiano Ronaldo",
  "Ronaldo goals by date",
  "Ronaldo 985 goals",
];
