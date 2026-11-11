import "server-only";
import { ALL_MMDD, MONTH_NAMES, MONTH_SLUGS, formatLongDate, formatMmdd } from "./dates";
import {
  DATA_UPDATED,
  FIRST_GOAL_DATE,
  LATEST_GOAL_DATE,
  TOTAL_GOALS,
  isoDay,
  lastModifiedFor,
  lastModifiedForMonth,
  matchesForDate,
  monthStats,
  scoringDayCount,
  type Match,
} from "./goals";
import {
  ABOUT_DESCRIPTION,
  ABOUT_TITLE,
  CALENDAR_DESCRIPTION,
  CALENDAR_TITLE,
  calendarCrumbs,
  dateCrumbs,
  dateDescription,
  dateTitle,
  matchPhrase,
  monthCrumb,
  monthCrumbs,
  monthDescription,
  monthTitle,
  plural,
  type Crumb,
} from "./seo";
import { CREATOR, SITE_NAME, SITE_URL } from "./site";

/**
 * schema.org JSON-LD, built only from data that is also visible on the page.
 * No FAQPage / HowTo (rich results retired), no SportsEvent (for upcoming events; ours are past and lack venues),
 * no sitelinks SearchAction (retired).
 */

type Json = string | number | boolean | Json[] | { [k: string]: Json };
export type Node = { [k: string]: Json };
export type Graph = { "@context": "https://schema.org"; "@graph": Node[] };

export const WEBSITE_ID = `${SITE_URL}/#website`;
export const PERSON_CREATOR_ID = `${SITE_URL}/#creator`;
export const PERSON_CR7_ID = `${SITE_URL}/#cristiano-ronaldo`;

const ref = (id: string) => ({ "@id": id });
const abs = (path: string) => (path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`);

export const WIKIPEDIA_INTERNATIONAL =
  "https://en.wikipedia.org/wiki/List_of_international_goals_scored_by_Cristiano_Ronaldo";
export const KAGGLE_DATASET =
  "https://www.kaggle.com/datasets/azminetoushikwasi/lionel-messi-vs-cristiano-ronaldo-club-goals";
export const ODBL = "https://opendatacommons.org/licenses/odbl/1-0/";

/** Wrap nodes in one graph. Undefined/null values are dropped so nothing empty is ever emitted. */
export function graph(...nodes: (Node | null | undefined)[]): Graph {
  return { "@context": "https://schema.org", "@graph": nodes.filter((n): n is Node => !!n).map((n) => clean(n)) };
}

function clean<T>(v: T): T {
  if (Array.isArray(v)) return v.filter((x) => x !== undefined && x !== null).map(clean) as T;
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v)
        .filter(([, x]) => x !== undefined && x !== null)
        .map(([k, x]) => [k, clean(x)]),
    ) as T;
  }
  return v;
}

// ---------- Shared entities (root layout, every page) ----------

export function siteGraph(): Graph {
  return graph(
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: SITE_NAME,
      alternateName: ["Has Ronaldo Scored On Your Birthday", "hasronaldoscoredonyourbirthday.xyz"],
      url: `${SITE_URL}/`,
      description: "Has Ronaldo scored on your birthday? Every official Cristiano Ronaldo goal, by calendar date.",
      inLanguage: "en",
      publisher: ref(PERSON_CREATOR_ID),
    },
    {
      "@type": "Person",
      "@id": PERSON_CREATOR_ID,
      name: CREATOR.name,
      url: CREATOR.portfolioUrl,
      sameAs: [CREATOR.xUrl],
    },
    {
      "@type": "Person",
      "@id": PERSON_CR7_ID,
      name: "Cristiano Ronaldo",
      alternateName: "Cristiano Ronaldo dos Santos Aveiro",
      birthDate: "1985-02-05",
      sameAs: ["https://en.wikipedia.org/wiki/Cristiano_Ronaldo", "https://www.wikidata.org/wiki/Q11571"],
    },
  );
}

// ---------- Building blocks ----------

export function breadcrumbList(id: string, crumbs: Crumb[]): Node {
  return {
    "@type": "BreadcrumbList",
    "@id": id,
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: abs(c.path),
    })),
  };
}

export function itemList(id: string, name: string, items: { name: string; url: string }[]): Node {
  return {
    "@type": "ItemList",
    "@id": id,
    name,
    numberOfItems: items.length,
    itemListElement: items.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.name, url: x.url })),
  };
}

/** One VideoObject for a match with a saved (verified/auto) video; null otherwise. */
export type VideoMeta = {
  title: string;
  description: string;
  thumbnailUrl: string;
  embedUrl: string;
  /** ISO 8601 with time zone. */
  uploadDate: string;
  /** True when uploadDate is YouTube's real publish time (not the match-date fallback). */
  realUploadDate: boolean;
};

/** Shared by the VideoObject JSON-LD and the video sitemap, so they always agree. Null without a saved video. */
export function videoMeta(m: Match): VideoMeta | null {
  if (!m.video) return null;
  const n = m.goals.length;
  const id = m.video.youtubeId;
  return {
    title: `Cristiano Ronaldo vs ${m.opponent}, ${m.year}: ${plural(n, "goal")}`,
    description: `Cristiano Ronaldo scored ${plural(n, "goal")} in ${matchPhrase(m)}, played on ${formatLongDate(m.date)}.`,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
    // Prefer the real YouTube publish time; the match date (UTC midnight) is only a fallback.
    uploadDate: m.video.publishedAt ?? `${m.date}T00:00:00Z`,
    realUploadDate: !!m.video.publishedAt,
  };
}

export function videoObject(pageUrl: string, m: Match): Node | null {
  const v = videoMeta(m);
  if (!v) return null;
  return {
    "@type": "VideoObject",
    "@id": `${pageUrl}#video-${m.matchId}`,
    name: v.title,
    description: v.description,
    thumbnailUrl: [v.thumbnailUrl],
    uploadDate: v.uploadDate,
    embedUrl: v.embedUrl,
    url: `${pageUrl}#m-${m.matchId}`,
    isPartOf: ref(`${pageUrl}#page`),
    about: ref(PERSON_CR7_ID),
  };
}

// ---------- Per-route graphs ----------

/** /birthday/[mmdd]: ItemPage + BreadcrumbList (+ ItemList of matches and VideoObjects on scoring dates). */
export function dateGraph(mmdd: string): Graph {
  const url = `${SITE_URL}/birthday/${mmdd}`;
  // Same order as the episodes on the page (newest first), so list positions match what people see.
  const matches = matchesForDate(mmdd);
  const label = formatMmdd(mmdd);
  const goalsList = matches.length
    ? itemList(
        `${url}#goals`,
        `Cristiano Ronaldo's goals on ${label}`,
        matches.map((m) => ({ name: matchPhrase(m), url: `${url}#m-${m.matchId}` })),
      )
    : null;
  return graph(
    {
      "@type": "ItemPage",
      "@id": `${url}#page`,
      url,
      name: dateTitle(mmdd),
      description: dateDescription(mmdd),
      isPartOf: ref(WEBSITE_ID),
      about: ref(PERSON_CR7_ID),
      dateModified: isoDay(lastModifiedFor(mmdd)),
      inLanguage: "en",
      breadcrumb: ref(`${url}#breadcrumb`),
      primaryImageOfPage: `${url}/opengraph-image/card`,
      ...(goalsList ? { mainEntity: ref(`${url}#goals`) } : {}),
    },
    breadcrumbList(`${url}#breadcrumb`, dateCrumbs(mmdd)),
    goalsList,
    ...matches.map((m) => videoObject(url, m)),
  );
}

/** /calendar: CollectionPage + BreadcrumbList + ItemList of the 12 month hubs. */
export function calendarGraph(): Graph {
  const url = `${SITE_URL}/calendar`;
  return graph(
    {
      "@type": "CollectionPage",
      "@id": `${url}#page`,
      url,
      name: CALENDAR_TITLE,
      description: CALENDAR_DESCRIPTION,
      isPartOf: ref(WEBSITE_ID),
      about: ref(PERSON_CR7_ID),
      dateModified: LATEST_GOAL_DATE,
      inLanguage: "en",
      breadcrumb: ref(`${url}#breadcrumb`),
      mainEntity: ref(`${url}#months`),
    },
    breadcrumbList(`${url}#breadcrumb`, calendarCrumbs()),
    itemList(
      `${url}#months`,
      "Cristiano Ronaldo's goals by month",
      MONTH_NAMES.map((name, i) => ({ name: `Ronaldo goals in ${name}`, url: `${url}/${MONTH_SLUGS[i]}` })),
    ),
  );
}

/** /calendar/{month}: CollectionPage + BreadcrumbList + ItemList of that month's scoring dates (calendar order). */
export function monthGraph(month: number): Graph {
  const url = `${SITE_URL}${monthCrumb(month).path}`;
  const m = monthStats(month);
  const name = MONTH_NAMES[month - 1];
  return graph(
    {
      "@type": "CollectionPage",
      "@id": `${url}#page`,
      url,
      name: monthTitle(month),
      description: monthDescription(month),
      isPartOf: ref(WEBSITE_ID),
      about: ref(PERSON_CR7_ID),
      dateModified: isoDay(lastModifiedForMonth(month)),
      inLanguage: "en",
      breadcrumb: ref(`${url}#breadcrumb`),
      ...(m.scoring.length ? { mainEntity: ref(`${url}#dates`) } : {}),
    },
    breadcrumbList(`${url}#breadcrumb`, monthCrumbs(month)),
    m.scoring.length
      ? itemList(
          `${url}#dates`,
          `Dates Cristiano Ronaldo has scored on in ${name}`,
          m.scoring.map((d) => ({
            name: `${d.label}: ${plural(d.count, "goal")}`,
            url: `${SITE_URL}/birthday/${d.mmdd}`,
          })),
        )
      : null,
  );
}

/** /about: AboutPage + the open goal Dataset (for Google Dataset Search). */
export function aboutGraph({ downloadUrl }: { downloadUrl?: string } = {}): Graph {
  const url = `${SITE_URL}/about`;
  return graph(
    {
      "@type": "AboutPage",
      "@id": `${url}#page`,
      url,
      name: ABOUT_TITLE,
      description: ABOUT_DESCRIPTION,
      isPartOf: ref(WEBSITE_ID),
      about: ref(WEBSITE_ID),
      author: ref(PERSON_CREATOR_ID),
      publisher: ref(PERSON_CREATOR_ID),
      dateModified: DATA_UPDATED,
      inLanguage: "en",
    },
    {
      "@type": "Dataset",
      "@id": `${url}#dataset`,
      name: "Cristiano Ronaldo's official goals by date",
      description:
        `All ${TOTAL_GOALS} official senior goals scored by Cristiano Ronaldo for club and country, ` +
        `from ${formatLongDate(FIRST_GOAL_DATE)} to ${formatLongDate(LATEST_GOAL_DATE)}, with date, team, opponent, ` +
        `competition, minute and goal type. They fall on ${scoringDayCount()} of the ${ALL_MMDD.length} calendar dates.`,
      url: `${url}#data`,
      license: ODBL,
      creator: ref(PERSON_CREATOR_ID),
      isBasedOn: [WIKIPEDIA_INTERNATIONAL, KAGGLE_DATASET],
      temporalCoverage: `${FIRST_GOAL_DATE}/${LATEST_GOAL_DATE}`,
      dateModified: DATA_UPDATED,
      variableMeasured: ["date", "team", "opponent", "competition", "minute", "goal type"],
      about: ref(PERSON_CR7_ID),
      ...(downloadUrl
        ? { distribution: { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: downloadUrl } }
        : {}),
    },
  );
}
