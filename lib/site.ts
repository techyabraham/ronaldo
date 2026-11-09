export const SITE_NAME = "GOAT Day";
export const SITE_TAGLINE = "Did Ronaldo score on your birthday?";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ??
  "http://localhost:3000"
).replace(/\/$/, "");

export const CORRECTIONS_URL = "https://github.com/OWNER/REPO/issues/new?template=correction.md";

export const DISCLAIMER =
  "Unofficial fan site. Not affiliated with Cristiano Ronaldo, his clubs, or any league. Videos are embedded from YouTube and belong to their owners.";

export const KEYWORDS = [
  "Cristiano Ronaldo",
  "Ronaldo birthday goal",
  "did Ronaldo score on my birthday",
  "Christiano Ronaldo",
  "Ronaldo goals by date",
  "Ronaldo 985 goals",
];
