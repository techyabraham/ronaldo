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

/** The one canonical origin. The apex domain and http:// must redirect here (Vercel → Domains). */
export const PRODUCTION_ORIGIN = "https://www.hasronaldoscoredonyourbirthday.xyz";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ??
  "http://localhost:3000"
).replace(/\/$/, "");

// Build-time guard: a production build with the wrong origin would ship the wrong canonicals, sitemap and share URLs.
// (VERCEL_ENV is not NEXT_PUBLIC_, so this never runs in the browser.)
if (process.env.VERCEL_ENV === "production" && SITE_URL !== PRODUCTION_ORIGIN) {
  throw new Error(
    `NEXT_PUBLIC_SITE_URL must be ${PRODUCTION_ORIGIN} in production (got ${SITE_URL}). ` +
      "Set it in Vercel → Settings → Environment Variables (Production) and redeploy.",
  );
}

export const CORRECTIONS_URL = "https://github.com/techyabraham/ronaldo/issues/new?template=correction.md";

export const DISCLAIMER =
  "Unofficial fan site. Not affiliated with Cristiano Ronaldo, his clubs, or any league. Videos are embedded from YouTube and belong to their owners.";
