import teamCodes from "@/data/team-codes.json";

export { competitionLabel } from "./competition";

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
