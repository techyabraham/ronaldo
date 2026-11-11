import type { Metadata } from "next";
import Link from "next/link";
import { BirthdayPicker } from "@/components/BirthdayPicker";
import { FlagBar } from "@/components/FlagBar";
import { GoalCalendar } from "@/components/GoalCalendar";
import { HeroArt } from "@/components/HeroArt";
import { HomeFacts } from "@/components/HomeFacts";
import { HomeInvite } from "@/components/HomeInvite";
import { TabBar } from "@/components/TabBar";
import { TodayChip } from "@/components/TodayChip";
import { TrendTile } from "@/components/TrendTile";
import { formatMmdd, shortLabel } from "@/lib/dates";
import {
  TOTAL_GOALS,
  countsByDay,
  matchesForDate,
  maxDayCount,
  perTeamTotals,
  pickFamous,
  popularDays,
  scoringDayCount,
  seasonCount,
} from "@/lib/goals";
import { GOAT_MOMENTS } from "@/lib/moments";
import { thumbPhotoFor } from "@/lib/photos";
import { TeamPhoto } from "@/components/TeamPhoto";
import { HOME_DESCRIPTION, HOME_TITLE, socialMeta } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  ...socialMeta({ title: HOME_TITLE, description: HOME_DESCRIPTION, path: "/" }),
};

export default function Home() {
  const counts = countsByDay();
  const max = maxDayCount();
  const seasons = seasonCount();
  const trending = popularDays(6).map((d, i) => {
    const top = pickFamous(matchesForDate(d.mmdd));
    return {
      ...d,
      caption: `vs ${top.opponent}, ${top.year}`,
      tone: i % 2 ? ("red" as const) : ("green" as const),
      photo: thumbPhotoFor(top.team),
    };
  });

  return (
    <div className="mx-auto max-w-md">
      {/* Hero */}
      <section className="relative mx-4 mt-1 flex h-[420px] flex-col justify-end overflow-hidden rounded-[22px]">
        <HeroArt variant="home" photo="portugal-back" priority />
        <div className="absolute top-3.5 left-3.5 flex gap-1.5">
          <span className="rounded-md bg-red px-2 py-1 text-[11px] font-extrabold tracking-[0.08em] text-white">
            CRISTIANO RONALDO
          </span>
          <span className="rounded-md bg-bg px-2 py-1 text-[11px] font-extrabold tracking-[0.08em] text-green-text">
            {TOTAL_GOALS} GOALS
          </span>
        </div>
        <div className="relative flex flex-col gap-2.5 bg-bg p-[18px]">
          <h1 className="font-display text-[46px] uppercase leading-[0.96]">Has Ronaldo scored on your birthday?</h1>
          <p className="text-[15px] leading-snug text-muted">
            Cristiano Ronaldo. {TOTAL_GOALS} official goals. {seasons} seasons. One question about your day.
          </p>
          <FlagBar />
        </div>
      </section>

      {/* Picker */}
      <section
        id="pick"
        aria-label="Pick your birthday"
        className="mx-4 mt-3.5 scroll-mt-4 rounded-[20px] bg-surface p-3.5"
      >
        <BirthdayPicker reveal={{ total: TOTAL_GOALS, seasons, teams: perTeamTotals() }} />
      </section>

      {/* Trending */}
      <section aria-labelledby="trending-h" className="mt-6">
        <div className="flex items-center justify-between px-4">
          <h2 id="trending-h" className="text-lg font-extrabold">
            Trending birthdays
          </h2>
          <Link href="/calendar" className="inline-flex min-h-11 items-center text-[13px] font-bold text-red-text">
            See all
          </Link>
        </div>
        <div className="snap-row mt-1 px-4 pb-1 [scroll-padding-inline:1rem]">
          <TodayChip counts={counts} max={max} />
          <TrendTile
            mmdd="02-05"
            short={shortLabel("02-05")}
            label={formatMmdd("02-05")}
            count={counts["02-05"] ?? 0}
            max={max}
            caption="His own birthday"
            tone="neutral"
          />
          {trending.map((d) => (
            <TrendTile
              key={d.mmdd}
              mmdd={d.mmdd}
              short={shortLabel(d.mmdd)}
              label={d.label}
              count={d.count}
              max={max}
              caption={d.caption}
              tone={d.tone}
              photo={d.photo}
            />
          ))}
        </div>
      </section>

      {/* GOAT moments */}
      <section aria-labelledby="moments-h" className="mx-4 mt-6">
        <h2 id="moments-h" className="text-lg font-extrabold">
          GOAT moments
        </h2>
        <ol className="mt-2 flex flex-col gap-2">
          {GOAT_MOMENTS.map((m, i) => (
            <li key={m.matchId}>
              <Link href={m.href} className="flex min-h-14 items-center gap-3 text-text">
                <span className="w-[34px] font-display text-[40px] leading-none text-red" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[15px] font-extrabold">{m.title}</span>
                  <span className="text-xs text-muted">{m.subtitle}</span>
                </span>
                {thumbPhotoFor(m.team) && (
                  <span className="relative h-14 w-12 flex-none overflow-hidden rounded-lg" aria-hidden="true">
                    <TeamPhoto photo={thumbPhotoFor(m.team)!} sizes="48px" decorative />
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* His days */}
      <section aria-labelledby="days-h" className="mx-4 mt-6">
        <div className="flex items-baseline justify-between">
          <h2 id="days-h" className="text-lg font-extrabold">
            Ronaldo&apos;s {scoringDayCount()} scoring days
          </h2>
          <span className="text-xs text-muted">Dates he has scored on</span>
        </div>
        <div className="mt-2.5">
          <GoalCalendar />
        </div>
      </section>

      <HomeFacts />

      <div className="mx-4 mt-6">
        <HomeInvite url={`${SITE_URL}/`} />
      </div>

      <TabBar url={`${SITE_URL}/`} />
    </div>
  );
}
