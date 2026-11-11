export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Days per month for a leap year, so 29 Feb is a valid birthday. */
export const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

/** All 366 "MM-DD" keys in calendar order. */
export const ALL_MMDD: string[] = DAYS_IN_MONTH.flatMap((days, m) =>
  Array.from({ length: days }, (_, d) => `${String(m + 1).padStart(2, "0")}-${String(d + 1).padStart(2, "0")}`),
);

export function isValidMmdd(s: string): boolean {
  return ALL_MMDD.includes(s);
}

export function mmdd(month: number, day: number) {
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** URL slugs for the month hubs: /calendar/january … /calendar/december. */
export const MONTH_SLUGS = MONTH_NAMES.map((m) => m.toLowerCase());

/** "june" -> 6; null for anything else. */
export function monthFromSlug(slug: string): number | null {
  const i = MONTH_SLUGS.indexOf(slug);
  return i < 0 ? null : i + 1;
}

/** "06-23" -> 6 */
export const monthOf = (key: string) => parseInt(key.slice(0, 2), 10);

/** The calendar day before/after, wrapping 31 Dec ↔ 1 Jan and including 29 Feb. */
export function adjacentMmdd(key: string, dir: 1 | -1): string {
  const i = ALL_MMDD.indexOf(key);
  return ALL_MMDD[(i + dir + ALL_MMDD.length) % ALL_MMDD.length];
}

/** "2021-06-23" -> "23 June 2021" */
export function formatLongDate(iso: string): string {
  const [y, m, d] = iso
    .slice(0, 10)
    .split("-")
    .map((x) => parseInt(x, 10));
  return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

/** "02-05" -> "5 February" */
export function formatMmdd(key: string): string {
  const [m, d] = key.split("-").map((x) => parseInt(x, 10));
  return `${d} ${MONTH_NAMES[m - 1]}`;
}

/** Ordinal suffix for a day: 1st, 2nd, 23rd… */
export function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Signed distance in days from `from` to `to` around the calendar (using a leap year). */
export function dayIndex(key: string) {
  return ALL_MMDD.indexOf(key);
}

/** Today's date as MM-DD in the viewer's local time zone (client only). */
export function todayMmdd(now = new Date()) {
  return mmdd(now.getMonth() + 1, now.getDate());
}

/** "06-23" -> "23 JUN" (tiles, calendar). */
export function shortLabel(key: string): string {
  const [m, d] = key.split("-");
  return `${d} ${MONTH_NAMES[parseInt(m, 10) - 1].slice(0, 3).toUpperCase()}`;
}
