import type { ReactNode } from "react";
import Link from "next/link";
import { MONTH_NAMES } from "@/lib/dates";
import type { CalendarRow } from "@/lib/goals";

/**
 * One month of tappable day cells, each linking to its date page with an accessible name
 * ("23 June, 4 goals" / "16 February, no goals"). Used on /calendar (12 of them) and on each month hub.
 * Server component, zero client JS.
 */
export function MonthGrid({ row, heading }: { row: CalendarRow; heading: ReactNode }) {
  const name = MONTH_NAMES[row.month - 1];
  return (
    <section aria-labelledby={`m-${row.month}`}>
      <h2 id={`m-${row.month}`} className="font-display text-2xl uppercase tracking-[0.02em]">
        {heading}
      </h2>
      <ul className="mt-2 grid grid-cols-7 gap-[3px]" aria-label={`${name} dates`}>
        {row.cells
          .filter((c) => c.state !== "void")
          .map((c) => {
            const label = `${c.day} ${name}, ${c.count ? `${c.count} goal${c.count === 1 ? "" : "s"}` : "no goals"}`;
            return (
              <li key={c.mmdd}>
                <Link
                  href={`/birthday/${c.mmdd}`}
                  aria-label={label}
                  className={`flex aspect-square min-h-11 flex-col items-center justify-center rounded-md leading-none ${
                    c.state === "hit" ? "bg-green text-green-ink" : "bg-cell-empty text-faint"
                  }`}
                >
                  <span className="font-display text-lg">{c.day}</span>
                  {c.count > 0 && <span className="mt-0.5 text-[10px] font-extrabold">{c.count}</span>}
                </Link>
              </li>
            );
          })}
      </ul>
    </section>
  );
}
