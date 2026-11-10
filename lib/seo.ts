import "server-only";
import type { Metadata, MetadataRoute } from "next";
import { competitionLabel } from "./competition";
import { MONTH_NAMES, MONTH_SLUGS, formatMmdd, monthOf } from "./dates";
import {
  TOTAL_GOALS,
  matchesForDate,
  nearestScoringDays,
  rankFamous,
  restDayCount,
  summarise,
  type Match,
} from "./goals";
import { MATCH_NOTES } from "./moments";
import { CREATOR, SITE_NAME } from "./site";

/** Google shows ~60 characters of a title and ~155 of a description. Tests enforce both. */
export const TITLE_MAX = 60;
export const DESC_MIN = 120;
export const DESC_MAX = 155;

/** Built from the data, so the goal count never goes stale. (Google ignores `keywords`; other engines don't.) */
export const KEYWORDS = [
  "Cristiano Ronaldo",
  "Ronaldo birthday goal",
  "did Ronaldo score on my birthday",
  "Has Ronaldo scored on my birthday",
  "Christiano Ronaldo",
  "Ronaldo goals by date",
  `Ronaldo ${TOTAL_GOALS} goals`,
];

/** True only for the live Vercel production deployment. Previews, CI and local builds are not indexable. */
export function isProductionDeploy(env: Record<string, string | undefined> = process.env) {
  return env.VERCEL_ENV === "production";
}

/**
 * Production: crawl everything except the dev-only tools. OG and Story image routes stay crawlable (Google and social
 * crawlers fetch them), and no search or AI crawler is singled out: we want the citations.
 * Previews and local builds: block everything.
 */
export function robotsFor(production: boolean, siteUrl: string): MetadataRoute.Robots {
  if (!production) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] },
    sitemap: [`${siteUrl}/sitemap.xml`],
    host: siteUrl,
  };
}

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function listJoin(xs: string[]) {
  if (xs.length <= 1) return xs.join("");
  return `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`;
}

/** Cut to `max` characters at a word boundary (never mid-word), dropping trailing punctuation. */
export function trimAt(s: string, max: number) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max + 1);
  const i = cut.lastIndexOf(" ");
  return (i > 0 ? cut.slice(0, i) : s.slice(0, max)).replace(/[\s,;:–—-]+$/, "");
}

/** "3-0 (a.e.t.)" -> "3–0 (a.e.t.)" */
export const dash = (result: string) => result.replace(/(\d)-(\d)/g, "$1–$2");

/** "Portugal 2–2 France" */
export function scoreline(m: Pick<Match, "team" | "opponent" | "result">) {
  return m.result ? `${m.team} ${dash(m.result)} ${m.opponent}` : `${m.team} vs ${m.opponent}`;
}

/** "Portugal 2–2 France (Euro 2020, 2021)"; "(World Cup 2026)" when the label already carries the year. */
export function matchPhrase(m: Pick<Match, "team" | "opponent" | "result" | "competition" | "year">) {
  const comp = competitionLabel(m.competition, m.year);
  return `${scoreline(m)} (${comp.endsWith(String(m.year)) ? comp : `${comp}, ${m.year}`})`;
}

/** The first candidate that fits, else the last one cut at a word boundary. */
function firstFit(candidates: string[], max: number) {
  return candidates.find((c) => c.length <= max) ?? trimAt(candidates.at(-1)!, max);
}

/** The nearer of the two nearest scoring days (ties go to the later one). */
export function closestScoringDay(mmdd: string) {
  const { before, after } = nearestScoringDays(mmdd);
  if (!before) return after ? { ...after, dir: "later" as const } : null;
  if (!after) return { ...before, dir: "earlier" as const };
  return after.offset <= before.offset ? { ...after, dir: "later" as const } : { ...before, dir: "earlier" as const };
}

// ---------- Titles ----------

export const HOME_TITLE = `Has Ronaldo scored on your birthday? | ${SITE_NAME}`;
export const CALENDAR_TITLE = "Ronaldo goal calendar: every date he has scored";
export const ABOUT_TITLE = "About & data sources";
/** Templated titles get " | GOAT Day" appended by the root layout. */
export const withBrand = (t: string) => `${t} | ${SITE_NAME}`;

/** Result pages use an absolute title (no brand), so the answer fits in 60 characters. */
export function dateTitle(mmdd: string): string {
  const s = summarise(mmdd);
  const q = `Did Ronaldo score on ${s.label}?`;
  if (s.count > 0) {
    const yes = `${q} Yes, ${plural(s.count, "goal")}`;
    const first = s.years[0];
    const last = s.years.at(-1)!;
    const span = first === last ? ` in ${first}` : ` (${first}–${last})`;
    return firstFit([yes + span, yes], TITLE_MAX);
  }
  return firstFit([`${q} No, but here's the closest`, `${q} Never. See the nearest`], TITLE_MAX);
}

export function monthTitle(month: number) {
  return `Ronaldo goals in ${MONTH_NAMES[month - 1]}: every date he scored`;
}

// ---------- Descriptions ----------

export const HOME_DESCRIPTION = `Has Ronaldo scored on your birthday? Pick any date and see which of Cristiano Ronaldo's ${TOTAL_GOALS} official goals came on it, with videos.`;
export const CALENDAR_DESCRIPTION =
  "Every calendar date Cristiano Ronaldo has scored an official goal on, at a glance. Tap any day to see Ronaldo's goals and watch them.";
export const ABOUT_DESCRIPTION =
  "How GOAT Day counts Cristiano Ronaldo's official goals, where the data comes from, its open licence, and how to report a correction.";

export function dateDescription(mmdd: string): string {
  const s = summarise(mmdd);
  if (s.count > 0) {
    const ms = rankFamous(matchesForDate(mmdd));
    const top = matchPhrase(ms[0]);
    const more = ms.length > 1 ? ", and more" : "";
    const head = `Yes. Cristiano Ronaldo scored ${plural(s.count, "official goal")} on ${s.label}`;
    return firstFit(
      [
        `${head}: ${top}${more}. Watch the goals and check your own birthday.`,
        `${head}: ${top}${more}. Watch them and check your birthday.`,
        `${head}: ${top}. Watch them and check your birthday.`,
        `${head}: ${top}.`,
        `${head}. Watch the goals and check your own birthday.`,
      ],
      DESC_MAX,
    );
  }
  const c = closestScoringDay(mmdd)!;
  const head = `No. Cristiano Ronaldo has never scored an official goal on ${s.label}.`;
  const near = `His nearest goal came ${plural(c.offset, "day")} ${c.dir}, vs ${c.opponent} in ${c.year}.`;
  return firstFit(
    [
      `${head} ${near} Check your birthday.`,
      `${head} ${near}`,
      `${head} His nearest came ${plural(c.offset, "day")} ${c.dir}, on ${c.label}.`,
    ],
    DESC_MAX,
  );
}

export function monthDescription(month: number, goals: number, dates: number) {
  const name = MONTH_NAMES[month - 1];
  return trimAt(
    `Every official Cristiano Ronaldo goal scored in ${name}, date by date: ${plural(goals, "goal")} on ${plural(dates, "date")}. Find your birthday and watch the goals.`,
    DESC_MAX,
  );
}

// ---------- OG image alt text ----------

export const HOME_OG_ALT = `Has Ronaldo scored on your birthday? ${SITE_NAME}`;

export function dateOgAlt(mmdd: string) {
  const s = summarise(mmdd);
  return s.count > 0 ? `Ronaldo scored ${plural(s.count, "goal")} on ${s.label}` : `Ronaldo never scored on ${s.label}`;
}

// ---------- Answer paragraphs (visible, answer-first) ----------

export function dateAnswer(mmdd: string): string {
  const s = summarise(mmdd);
  if (s.count > 0) {
    const ms = rankFamous(matchesForDate(mmdd));
    const shown = ms.slice(0, 3).map(matchPhrase);
    const rest = ms.length - shown.length;
    const list = rest > 0 ? `${shown.join(", ")} and ${rest} more` : listJoin(shown);
    const record = ms.map((m) => MATCH_NOTES[m.matchId]).find((x) => x?.record);
    const matches = `${ms.length} match${ms.length === 1 ? "" : "es"}`;
    return (
      `Yes. Cristiano Ronaldo has scored ${plural(s.count, "official goal")} on ${s.label}, in ${matches}: ` +
      `${list}.${record ? ` ${record.headline}` : ""}`
    );
  }
  const { before, after } = nearestScoringDays(mmdd);
  const near = [before, after].filter((d): d is NonNullable<typeof d> => !!d).map((d) => `${d.label} (${d.headline})`);
  return (
    `No. Cristiano Ronaldo has never scored an official goal on ${s.label}. ` +
    `It's one of ${restDayCount()} dates in the year without one.` +
    (near.length ? ` His nearest goals came on ${listJoin(near)}.` : "")
  );
}

// ---------- Breadcrumbs (one source for the visible trail and the BreadcrumbList JSON-LD) ----------

export type Crumb = { name: string; path: string };

const HOME_CRUMB: Crumb = { name: "Home", path: "/" };
const CALENDAR_CRUMB: Crumb = { name: "Calendar", path: "/calendar" };

export const monthCrumb = (month: number): Crumb => ({
  name: MONTH_NAMES[month - 1],
  path: `/calendar/${MONTH_SLUGS[month - 1]}`,
});

export const calendarCrumbs = (): Crumb[] => [HOME_CRUMB, CALENDAR_CRUMB];
export const monthCrumbs = (month: number): Crumb[] => [HOME_CRUMB, CALENDAR_CRUMB, monthCrumb(month)];
export const dateCrumbs = (mmdd: string): Crumb[] => [
  ...monthCrumbs(monthOf(mmdd)),
  { name: formatMmdd(mmdd), path: `/birthday/${mmdd}` },
];

// ---------- Shared Open Graph / Twitter blocks ----------

/** Page-level `openGraph` replaces the layout's, so every route builds the full block here. */
export function socialMeta({
  title,
  description,
  path,
  homeImage = false,
}: {
  title: string;
  description: string;
  path: string;
  /** Routes without their own opengraph-image file reuse the home card (a page-level openGraph drops the inherited one). */
  homeImage?: boolean;
}): Pick<Metadata, "alternates" | "openGraph" | "twitter"> {
  // Only set `images` when needed: even `images: undefined` would wipe a route's file-based opengraph-image.
  const img = homeImage ? { images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: HOME_OG_ALT }] } : {};
  return {
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: SITE_NAME, locale: "en_GB", type: "website", ...img },
    twitter: { card: "summary_large_image", title, description, creator: `@${CREATOR.handle}`, ...img },
  };
}
