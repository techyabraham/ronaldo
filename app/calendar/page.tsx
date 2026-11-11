import { Fragment } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PartnerBanner } from "@/components/partner/PartnerBanner";
import { PartnerStrip } from "@/components/partner/PartnerStrip";
import { PARTNER } from "@/lib/partner";
import { FlagBar } from "@/components/FlagBar";
import { JsonLd } from "@/components/JsonLd";
import { calendarGraph } from "@/lib/jsonld";
import { TabBar } from "@/components/TabBar";
import { Breadcrumb } from "@/components/Breadcrumb";
import { MonthGrid } from "@/components/MonthGrid";
import { MONTH_SLUGS } from "@/lib/dates";
import { calendarRows, scoringDayCount } from "@/lib/goals";
import { CALENDAR_DESCRIPTION, CALENDAR_TITLE, calendarCrumbs, socialMeta, withBrand } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: CALENDAR_TITLE,
  description: CALENDAR_DESCRIPTION,
  ...socialMeta({
    title: withBrand(CALENDAR_TITLE),
    description: CALENDAR_DESCRIPTION,
    path: "/calendar",
    homeImage: true,
  }),
};

export default function CalendarPage() {
  const rows = calendarRows();
  return (
    <>
      <div className="mx-auto max-w-md px-4 pt-1">
        <Breadcrumb crumbs={calendarCrumbs()} />
        <p className="eyebrow mt-1">All 366 dates</p>
        <h1 className="mt-1 font-display text-5xl uppercase leading-[0.94]">Ronaldo&apos;s goal calendar</h1>
        <p className="mt-3 text-[15px] text-muted">{scoringDayCount()} of 366 dates have a Ronaldo goal. Find yours.</p>
        <FlagBar className="mt-4 w-24" />
        <ul className="mt-4 flex gap-4 text-xs text-muted" aria-label="Legend">
          <li className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[3px] bg-green" aria-hidden="true" />
            Ronaldo scored
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[3px] bg-cell-empty" aria-hidden="true" />
            Rest day
          </li>
        </ul>

        <div className="mt-6 flex flex-col gap-7">
          {PARTNER.enabled && <PartnerBanner placement="calendar" slot={1} />}
          {rows.map((r) => (
            <Fragment key={r.month}>
              <MonthGrid
                row={r}
                heading={
                  <Link
                    href={`/calendar/${MONTH_SLUGS[r.month - 1]}`}
                    className="inline-flex min-h-11 items-center gap-2 underline-offset-4 hover:underline"
                  >
                    {r.label}
                    <span aria-hidden="true" className="text-lg text-muted">
                      →
                    </span>
                  </Link>
                }
              />
              {/* A compact strip after every second month (Feb, Apr, Jun, Aug, Oct): slots 2–6. */}
              {PARTNER.enabled && r.month % 2 === 0 && r.month < 12 && (
                <PartnerStrip placement="calendar" slot={r.month / 2 + 1} />
              )}
            </Fragment>
          ))}
        </div>
      </div>
      <TabBar url={`${SITE_URL}/`} />
      <JsonLd data={calendarGraph()} />
    </>
  );
}
