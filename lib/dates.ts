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
