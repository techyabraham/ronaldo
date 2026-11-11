import { MONTH_SLUGS } from "../../lib/dates";

/** The fields of a goal that show on its date page; a change in any of them means the page changed. */
type GoalLike = { id: string; mmdd: string } & Record<string, unknown>;

/** MM-DD keys whose goals were added, removed or edited between two versions of data/goals.json. */
export function changedDates(before: GoalLike[], after: GoalLike[]): string[] {
  const byDate = (gs: GoalLike[]) => {
    const m = new Map<string, string[]>();
    for (const g of gs) m.set(g.mmdd, [...(m.get(g.mmdd) ?? []), JSON.stringify(g)]);
    return new Map([...m].map(([k, v]) => [k, v.sort().join("\n")]));
  };
  const a = byDate(before);
  const b = byDate(after);
  return [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort();
}

/**
 * URLs to ping after a data change: each changed date page and its month hub, plus the pages that show live
 * totals (home, calendar, about). Absolute, www, no trailing slash.
 */
export function urlsForDates(site: string, dates: string[]): string[] {
  if (!dates.length) return [];
  const months = [...new Set(dates.map((d) => MONTH_SLUGS[parseInt(d.slice(0, 2), 10) - 1]))];
  return [
    site,
    `${site}/calendar`,
    ...months.map((m) => `${site}/calendar/${m}`),
    ...dates.map((d) => `${site}/birthday/${d}`),
    `${site}/about`,
  ];
}

/** IndexNow request body (https://www.indexnow.org/documentation). */
export function indexNowPayload(site: string, key: string, urlList: string[]) {
  return { host: new URL(site).host, key, keyLocation: `${site}/${key}.txt`, urlList };
}
