import { formatMmdd } from "@/lib/dates";
import { careerFacts, type FactGoal } from "@/lib/goals";
import { listJoin } from "@/lib/seo";

const TYPE_WORD: Record<string, [string, string]> = {
  penalty: ["penalty", "penalties"],
  "free-kick": ["free kick", "free kicks"],
  header: ["header", "headers"],
  "open-play": ["open play", "open play"],
};

const NUMBERS_SHOWN = 12;

const goalLine = (g: FactGoal) => `${g.year} — ${g.team} vs ${g.opponent} (career goal #${g.n})`;

/** "{D Month} in Ronaldo's career": only rows with data, every value from data/goals.json. Server component. */
export function CareerFacts({ mmdd }: { mmdd: string }) {
  const f = careerFacts(mmdd);
  if (!f) return null;
  const label = formatMmdd(mmdd);
  const extra = f.numbers.length - NUMBERS_SHOWN;
  const rows: [string, string][] = [
    ["First goal on this date", goalLine(f.first)],
    ...(f.latest.n !== f.first.n ? [["Most recent", goalLine(f.latest)] as [string, string]] : []),
    ["Clubs and country", f.teams.map((t) => `${t.team} (${t.goals})`).join(", ")],
    ["Competitions", f.competitions.join(", ")],
    ...(f.types.length
      ? [
          [
            "Goal types",
            listJoin(f.types.map((t) => `${t.count} ${TYPE_WORD[t.type][t.count === 1 ? 0 : 1]}`)) +
              (f.unknownTypes > 0 ? `; type not recorded for ${f.unknownTypes}` : ""),
          ] as [string, string],
        ]
      : []),
    ["Rank", `${label} is ${f.rank.tied ? "joint " : ""}#${f.rank.rank} of 366 dates for Ronaldo goals`],
    [
      "Career goal numbers",
      f.numbers
        .slice(0, NUMBERS_SHOWN)
        .map((n) => `#${n}`)
        .join(", ") + (extra > 0 ? `, and ${extra} more` : ""),
    ],
  ];

  return (
    <section aria-labelledby="career-h" className="rounded-[18px] bg-surface p-4">
      <h2 id="career-h" className="text-lg font-extrabold">
        {label} in Ronaldo&apos;s career
      </h2>
      <dl className="mt-2 flex flex-col divide-y divide-hairline">
        {rows.map(([k, v]) => (
          <div key={k} className="flex flex-col gap-0.5 py-2.5">
            <dt className="text-[11px] font-extrabold tracking-[0.1em] text-muted uppercase">{k}</dt>
            <dd className="text-sm leading-snug">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
