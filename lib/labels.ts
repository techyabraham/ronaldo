import teamCodes from "@/data/team-codes.json";

/** Euro editions are named for the planned year: the tournament played in 2021 is "Euro 2020". */
const EURO_EDITION: Record<number, number> = { 2021: 2020 };

/**
 * Display label for a competition in a given year.
 * "European Championship" -> "Euro 2016" (2021 -> "Euro 2020"); "World Cup" -> "World Cup 2018"; others unchanged.
 */
export function competitionLabel(competition: string, year: number): string {
  if (competition === "European Championship") return `Euro ${EURO_EDITION[year] ?? year}`;
  if (competition === "World Cup") return `World Cup ${year}`;
  return competition;
}

const CODES = teamCodes as Record<string, string>;

/** 3-letter code for share images only (POR 2–2 FRA). In the app UI we keep full names. */
export function teamCode(name: string): string {
  const code = CODES[name];
  if (code) return code;
  // Unknown name (new opponent after a data refresh): derive something sensible rather than fail the build.
  return name
    .normalize("NFKD")
    .replace(/[^A-Za-z ]/g, "")
    .replace(/^(Al|FC|AC|CF|Real|Club) /i, "")
    .replace(/\s+/g, "")
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, "X");
}
