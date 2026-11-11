import goals from "@/data/goals.json";

/** Prerendered at build time: the file only changes when the data does (i.e. on a new deploy). */
export const dynamic = "force-static";

/**
 * The open goal list (ODbL), as linked from /about#data and the Dataset JSON-LD `distribution`.
 * Kept out of the sitemap; it's a download, not a page.
 */
export function GET() {
  return new Response(JSON.stringify(goals), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Link: '<https://opendatacommons.org/licenses/odbl/1-0/>; rel="license"',
      "X-Attribution":
        "Cristiano Ronaldo goals by date, GOAT Day (hasronaldoscoredonyourbirthday.xyz), ODbL 1.0. Built from Wikipedia (CC BY-SA 4.0) and the Messi vs Ronaldo Club Goals dataset by Azmine Toushik Wasi (ODbL).",
    },
  });
}
