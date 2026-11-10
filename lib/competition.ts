/** Euro editions are named for the planned year: the tournament played in 2021 is "Euro 2020". */
const EURO_EDITION: Record<number, number> = { 2021: 2020 };

/**
 * Display label for a competition in a given year.
 * "European Championship" -> "Euro 2016" (2021 -> "Euro 2020"); "World Cup" -> "World Cup 2018"; others unchanged.
 * Kept separate from lib/labels.ts so client bundles don't pull in the team-code table.
 */
export function competitionLabel(competition: string, year: number): string {
  if (competition === "European Championship") return `Euro ${EURO_EDITION[year] ?? year}`;
  if (competition === "World Cup") return `World Cup ${year}`;
  return competition;
}
