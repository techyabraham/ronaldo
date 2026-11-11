import type { MetadataRoute } from "next";
import { ALL_MMDD, MONTH_SLUGS } from "@/lib/dates";
import { DATA_UPDATED, LATEST_GOAL_DATE, lastModifiedFor, lastModifiedForMonth } from "@/lib/goals";
import { SITE_URL } from "@/lib/site";

const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

/**
 * 381 URLs: home, calendar, 12 month hubs, 366 date pages, about. Absolute, www, no trailing slash.
 * lastModified is when each page's content last changed (its newest relevant goal), not the build date.
 * No priority/changeFrequency (Google ignores both). Image routes, /admin, /api and /data/goals.json stay out.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, lastModified: day(LATEST_GOAL_DATE) },
    { url: `${SITE_URL}/calendar`, lastModified: day(LATEST_GOAL_DATE) },
    ...MONTH_SLUGS.map((slug, i) => ({
      url: `${SITE_URL}/calendar/${slug}`,
      lastModified: lastModifiedForMonth(i + 1),
    })),
    ...ALL_MMDD.map((mmdd) => ({ url: `${SITE_URL}/birthday/${mmdd}`, lastModified: lastModifiedFor(mmdd) })),
    { url: `${SITE_URL}/about`, lastModified: day(DATA_UPDATED) },
  ];
}
