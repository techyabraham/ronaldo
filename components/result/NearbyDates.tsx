import Link from "next/link";
import { MONTH_NAMES, adjacentMmdd, formatMmdd, monthOf } from "@/lib/dates";
import { monthScoringDays, summarise } from "@/lib/goals";
import { monthCrumb } from "@/lib/seo";

const goalsText = (n: number) => (n ? `${n} goal${n === 1 ? "" : "s"}` : "no goals");

/**
 * Previous/next date (wrapping 31 Dec ↔ 1 Jan, 29 Feb included), the month's other scoring dates, and the month hub.
 * Plain <a href> links (no client JS): this is the main internal-linking path between date pages.
 */
export function NearbyDates({ mmdd }: { mmdd: string }) {
  const prev = adjacentMmdd(mmdd, -1);
  const next = adjacentMmdd(mmdd, 1);
  const month = monthOf(mmdd);
  const name = MONTH_NAMES[month - 1];
  const others = monthScoringDays(month)
    .filter((d) => d.mmdd !== mmdd)
    .slice(0, 6);
  const hub = monthCrumb(month).path;

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Nearby dates" className="grid grid-cols-2 gap-2">
        <Link
          href={`/birthday/${prev}`}
          rel="prev"
          className="flex min-h-14 flex-col justify-center rounded-[14px] bg-surface px-3.5 py-2"
        >
          <span className="text-[11px] font-extrabold tracking-[0.1em] text-muted">← PREVIOUS DAY</span>
          <span className="text-sm font-extrabold">
            {formatMmdd(prev)} · {goalsText(summarise(prev).count)}
          </span>
        </Link>
        <Link
          href={`/birthday/${next}`}
          rel="next"
          className="flex min-h-14 flex-col items-end justify-center rounded-[14px] bg-surface px-3.5 py-2 text-right"
        >
          <span className="text-[11px] font-extrabold tracking-[0.1em] text-muted">NEXT DAY →</span>
          <span className="text-sm font-extrabold">
            {formatMmdd(next)} · {goalsText(summarise(next).count)}
          </span>
        </Link>
      </nav>

      <section aria-labelledby="month-more-h">
        <h2 id="month-more-h" className="text-lg font-extrabold">
          More Ronaldo goals in {name}
        </h2>
        {others.length > 0 ? (
          <ul className="mt-1 grid grid-cols-2 gap-x-3">
            {others.map((d) => (
              <li key={d.mmdd}>
                <Link
                  href={`/birthday/${d.mmdd}`}
                  className="flex min-h-11 items-center justify-between gap-2 border-b border-hairline text-sm"
                >
                  <span className="font-bold">{d.label}</span>
                  <span className="text-xs text-muted">{goalsText(d.count)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-muted">No other {name} date has a Ronaldo goal.</p>
        )}
        <Link href={hub} className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-red-text">
          See all of {name} →
        </Link>
      </section>
    </div>
  );
}
