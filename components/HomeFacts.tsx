import type { ReactNode } from "react";
import Link from "next/link";
import { ALL_MMDD, formatLongDate } from "@/lib/dates";
import {
  DATA_UPDATED,
  LATEST_GOAL_DATE,
  TOTAL_GOALS,
  matchesForDate,
  nearestScoringDays,
  popularDays,
  restDayCount,
  scoringDayCount,
  seasonCount,
  summarise,
} from "@/lib/goals";
import { listJoin, plural } from "@/lib/seo";

const tile = "flex flex-col-reverse gap-0.5 rounded-[14px] bg-surface p-3";
const tileKey = "text-[11px] font-extrabold tracking-[0.1em] text-muted";
const tileValue = "font-display text-4xl leading-none";
const link = "font-bold text-red-text underline";

/**
 * "Ronaldo by the numbers" and "Questions people ask": live numbers, plain HTML answers (<details>, no JS).
 * Deliberately no FAQPage markup: FAQ rich results are gone; the visible text is for people and answer engines.
 */
export function HomeFacts() {
  const top = popularDays(1)[0];
  const best = popularDays(ALL_MMDD.length).filter((d) => d.count === top.count);
  const bday = summarise("02-05");
  const near = nearestScoringDays("02-05");
  const bdayNear = [near.before, near.after].filter((d): d is NonNullable<typeof d> => !!d);
  const rest = restDayCount();
  const topMatches = matchesForDate(top.mmdd).length;

  const faq: { q: string; a: ReactNode }[] = [
    {
      q: "Has Ronaldo ever scored on his own birthday (5 February)?",
      a: bday.count ? (
        <>
          Yes. Cristiano Ronaldo has scored {plural(bday.count, "official goal")} on 5 February, in{" "}
          {listJoin(bday.years.map(String))}.{" "}
          <Link className={link} href="/birthday/02-05">
            See them
          </Link>
          .
        </>
      ) : (
        <>
          No. Cristiano Ronaldo has never scored an official goal on 5 February, his birthday.
          {bdayNear.length > 0 &&
            ` His nearest goals came on ${listJoin(bdayNear.map((d) => `${d.label} (${d.headline})`))}.`}{" "}
          <Link className={link} href="/birthday/02-05">
            See 5 February
          </Link>
          .
        </>
      ),
    },
    {
      q: "Which date has Ronaldo scored the most goals on?",
      a: (
        <>
          {listJoin(best.map((d) => d.label))}, with {plural(top.count, "goal")}
          {best.length > 1 ? " each" : ` in ${topMatches} match${topMatches === 1 ? "" : "es"}`}.{" "}
          {best.map((d, i) => (
            <span key={d.mmdd}>
              {i > 0 && " · "}
              <Link className={link} href={`/birthday/${d.mmdd}`}>
                See {d.label}
              </Link>
            </span>
          ))}
        </>
      ),
    },
    {
      q: "How many dates has Ronaldo never scored on?",
      a: (
        <>
          {rest} of the 366 dates in the year (29 February included). He has scored on the other {scoringDayCount()}.{" "}
          <Link className={link} href="/calendar">
            See them all on the goal calendar
          </Link>
          .
        </>
      ),
    },
    {
      q: "Which goals count?",
      a: (
        <>
          Official senior goals for club and country: {TOTAL_GOALS} in all. Penalty-shootout kicks, youth-team goals and
          friendlies between clubs don&apos;t count; extra-time goals do.{" "}
          <Link className={link} href="/about#what-counts">
            How we count
          </Link>
          .
        </>
      ),
    },
    {
      q: "How often is this updated?",
      a: (
        <>
          Every week, from Wikipedia and club records. The data was last checked on {formatLongDate(DATA_UPDATED)}, and
          the latest goal included is from {formatLongDate(LATEST_GOAL_DATE)}.
        </>
      ),
    },
  ];

  return (
    <>
      <section aria-labelledby="numbers-h" className="mx-4 mt-6">
        <h2 id="numbers-h" className="text-lg font-extrabold">
          Ronaldo by the numbers
        </h2>
        <dl className="mt-2.5 grid grid-cols-2 gap-2">
          <div className={tile}>
            <dt className={tileKey}>OFFICIAL GOALS</dt>
            <dd className={`${tileValue} text-red`}>{TOTAL_GOALS}</dd>
          </div>
          <div className={tile}>
            <dt className={tileKey}>DATES HE HAS SCORED ON</dt>
            <dd className={`${tileValue} text-green-text`}>{scoringDayCount()}</dd>
          </div>
          <div className={tile}>
            <dt className={tileKey}>BEST BIRTHDAY</dt>
            <dd className={`${tileValue} text-text`}>
              <Link href={`/birthday/${top.mmdd}`} className="underline decoration-2 underline-offset-4">
                {top.label}
              </Link>
              <span className="mt-1 block font-sans text-xs font-bold text-muted">{plural(top.count, "goal")}</span>
            </dd>
          </div>
          <div className={tile}>
            <dt className={tileKey}>SEASONS SCORED IN</dt>
            <dd className={`${tileValue} text-text`}>{seasonCount()}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="faq-h" className="mx-4 mt-6">
        <h2 id="faq-h" className="text-lg font-extrabold">
          Questions people ask
        </h2>
        <div className="mt-1 divide-y divide-hairline">
          {faq.map((f) => (
            <details key={f.q} className="group">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 py-2.5 text-[15px] font-bold [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  aria-hidden="true"
                  className="flex-none text-xl text-muted transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="pb-3 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
