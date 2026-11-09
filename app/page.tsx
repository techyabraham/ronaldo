import Link from "next/link";
import { BirthdayPicker } from "@/components/BirthdayPicker";
import { HomeInvite } from "@/components/HomeInvite";
import { TabBar } from "@/components/TabBar";
import { SITE_URL } from "@/lib/site";
import { TodayChip } from "@/components/TodayChip";
import { chipCls } from "@/components/chip";
import { TOTAL_GOALS, countsByDay, popularDays, scoringDayCount } from "@/lib/goals";

export default function Home() {
  const popular = popularDays(6);
  const counts = countsByDay();
  return (
    <div className="mx-auto max-w-md">
      <section className="mx-auto max-w-xl px-4 pt-8 pb-10">
        <p className="text-sm font-extrabold uppercase tracking-widest text-red-text">The birthday goal checker</p>
        <h1 className="mt-2 text-[2.6rem] leading-[0.95] font-extrabold tracking-tight sm:text-6xl">
          Did Ronaldo score on <span className="text-red-text">your</span> birthday?
        </h1>
        <p className="mt-4 text-lg text-muted">
          Every one of his {TOTAL_GOALS} official goals, checked against your day.
        </p>
        <div className="mt-7">
          <BirthdayPicker />
        </div>
      </section>

      <section className="mx-auto max-w-xl px-4 pb-6" aria-labelledby="popular">
        <h2 id="popular" className="text-xl font-extrabold">
          Popular birthdays
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <TodayChip counts={counts} />
          <Link href="/birthday/02-05" className={chipCls}>
            <span aria-hidden="true">🎂</span> 5 February
            <span className="text-muted font-normal">· his birthday</span>
          </Link>
          {popular.map((d) => (
            <Link key={d.mmdd} href={`/birthday/${d.mmdd}`} className={chipCls}>
              <span aria-hidden="true">🔥</span> {d.label}
              <span className="text-muted font-normal">· {d.count} goals</span>
            </Link>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted">
          He has scored on {scoringDayCount()} of the 366 days of the year. Is yours one of them?
        </p>
      </section>

      <div className="mx-auto max-w-xl px-4 pb-6">
        <HomeInvite url={`${SITE_URL}/`} />
      </div>
      <TabBar url={`${SITE_URL}/`} />
    </div>
  );
}
