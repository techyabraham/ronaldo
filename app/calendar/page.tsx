import type { Metadata } from "next";
import Link from "next/link";
import { FlagBar } from "@/components/FlagBar";
import { TabBar } from "@/components/TabBar";
import { MONTH_NAMES } from "@/lib/dates";
import { calendarRows, scoringDayCount } from "@/lib/goals";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Ronaldo goal calendar: every date he has scored",
  description:
    "Every calendar date Cristiano Ronaldo has scored an official goal on, at a glance. Tap any day to see the GOAT's goals.",
  alternates: { canonical: "/calendar" },
};

export default function CalendarPage() {
  const rows = calendarRows();
  return (
    <>
      <div className="mx-auto max-w-md px-4 pt-4">
        <p className="eyebrow">All 366 dates</p>
        <h1 className="mt-1 font-display text-5xl uppercase leading-[0.94]">The GOAT calendar</h1>
        <p className="mt-3 text-[15px] text-muted">{scoringDayCount()} of 366 dates have a Ronaldo goal. Find yours.</p>
        <FlagBar className="mt-4 w-24" />
        <ul className="mt-4 flex gap-4 text-xs text-muted" aria-label="Legend">
          <li className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[3px] bg-green" aria-hidden="true" />
            GOAT scored
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[3px] bg-cell-empty" aria-hidden="true" />
            Rest day
          </li>
        </ul>

        <div className="mt-6 flex flex-col gap-7">
          {rows.map((r) => (
            <section key={r.month} aria-labelledby={`m-${r.month}`}>
              <h2 id={`m-${r.month}`} className="font-display text-2xl uppercase tracking-[0.02em]">
                {r.label}
              </h2>
              <ul className="mt-2 grid grid-cols-7 gap-[3px]">
                {r.cells
                  .filter((c) => c.state !== "void")
                  .map((c) => {
                    const name = `${c.day} ${MONTH_NAMES[r.month - 1]}, ${c.count ? `${c.count} goal${c.count === 1 ? "" : "s"}` : "no goals"}`;
                    return (
                      <li key={c.mmdd}>
                        <Link
                          href={`/birthday/${c.mmdd}`}
                          aria-label={name}
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
          ))}
        </div>
      </div>
      <TabBar url={`${SITE_URL}/`} />
    </>
  );
}
