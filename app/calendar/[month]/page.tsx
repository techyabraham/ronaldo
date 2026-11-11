import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { FlagBar } from "@/components/FlagBar";
import { JsonLd } from "@/components/JsonLd";
import { MonthGrid } from "@/components/MonthGrid";
import { PartnerStrip } from "@/components/partner/PartnerStrip";
import { PARTNER } from "@/lib/partner";
import { TabBar } from "@/components/TabBar";
import { TrustLine } from "@/components/TrustLine";
import { MONTH_NAMES, MONTH_SLUGS, formatMmdd, monthFromSlug } from "@/lib/dates";
import { calendarRows, matchesForDate, monthStats, pickFamous } from "@/lib/goals";
import { monthGraph } from "@/lib/jsonld";
import {
  matchPhrase,
  monthAnswer,
  monthCrumbs,
  monthDescription,
  monthTitle,
  plural,
  socialMeta,
  withBrand,
} from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return MONTH_SLUGS.map((month) => ({ month }));
}

export async function generateMetadata({ params }: PageProps<"/calendar/[month]">): Promise<Metadata> {
  const month = monthFromSlug((await params).month);
  if (!month) return {};
  const title = monthTitle(month);
  const description = monthDescription(month);
  return {
    title,
    description,
    ...socialMeta({
      title: withBrand(title),
      description,
      path: `/calendar/${MONTH_SLUGS[month - 1]}`,
      homeImage: true,
    }),
  };
}

/** Month hub: every date of one month, its best dates, its rest days. Server component, zero client JS. */
export default async function MonthPage({ params }: PageProps<"/calendar/[month]">) {
  const month = monthFromSlug((await params).month);
  if (!month) notFound();
  const name = MONTH_NAMES[month - 1];
  const m = monthStats(month);
  const row = calendarRows()[month - 1];
  const top = [...m.scoring]
    .sort((a, b) => b.count - a.count || a.mmdd.localeCompare(b.mmdd))
    .slice(0, 5)
    .map((d) => ({ ...d, line: matchPhrase(pickFamous(matchesForDate(d.mmdd))) }));
  const prev = ((month + 10) % 12) + 1;
  const next = (month % 12) + 1;

  return (
    <>
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 pt-1">
        <div>
          <Breadcrumb crumbs={monthCrumbs(month)} />
          <p className="eyebrow mt-1">{m.days} dates</p>
          <h1 className="mt-1 font-display text-5xl uppercase leading-[0.94]">Ronaldo goals in {name}</h1>
          <p data-testid="answer" className="mt-3 text-[15px] leading-snug text-muted">
            {monthAnswer(month)}
          </p>
          <FlagBar className="mt-4 w-24" />
        </div>

        {PARTNER.enabled && <PartnerStrip placement="month" slot={month} />}

        <MonthGrid row={row} heading={`Every ${name} date`} />

        {top.length > 0 && (
          <section aria-labelledby="top-h">
            <h2 id="top-h" className="text-lg font-extrabold">
              Top {name} dates
            </h2>
            <ol className="mt-2 flex flex-col gap-2">
              {top.map((d, i) => (
                <li key={d.mmdd}>
                  <Link
                    href={`/birthday/${d.mmdd}`}
                    className="flex min-h-14 items-center gap-3 rounded-[14px] bg-surface px-3.5 py-2.5"
                  >
                    <span className="w-6 font-display text-3xl leading-none text-red" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-[15px] font-extrabold">
                        {d.label} · {plural(d.count, "goal")}
                      </span>
                      <span className="text-xs text-muted">{d.line}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section aria-labelledby="rest-h">
          <h2 id="rest-h" className="text-lg font-extrabold">
            Rest days in {name}
          </h2>
          {m.rest.length > 0 ? (
            <>
              <p className="mt-1 text-sm text-muted">
                {m.rest.length === 1 ? "The one date" : `The ${m.rest.length} dates`} in {name} Ronaldo has never scored
                on:
              </p>
              <ul className="mt-1 flex flex-wrap gap-x-3">
                {m.rest.map((k) => (
                  <li key={k}>
                    <Link
                      href={`/birthday/${k}`}
                      className="inline-flex min-h-11 items-center text-sm font-bold underline"
                    >
                      {formatMmdd(k)}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted">None: Ronaldo has scored on every date in {name}.</p>
          )}
        </section>

        <nav aria-label="Other months" className="grid grid-cols-2 gap-2">
          <Link
            href={`/calendar/${MONTH_SLUGS[prev - 1]}`}
            rel="prev"
            className="flex min-h-14 items-center rounded-[14px] bg-surface px-3.5 text-sm font-extrabold"
          >
            ← {MONTH_NAMES[prev - 1]}
          </Link>
          <Link
            href={`/calendar/${MONTH_SLUGS[next - 1]}`}
            rel="next"
            className="flex min-h-14 items-center justify-end rounded-[14px] bg-surface px-3.5 text-sm font-extrabold"
          >
            {MONTH_NAMES[next - 1]} →
          </Link>
        </nav>

        <TrustLine />
      </div>
      <TabBar url={`${SITE_URL}/`} />
      <JsonLd data={monthGraph(month)} />
    </>
  );
}
