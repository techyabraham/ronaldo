import Link from "next/link";
import { FlagBar } from "@/components/FlagBar";
import { GoalCalendar } from "@/components/GoalCalendar";
import { HeroArt } from "@/components/HeroArt";
import { BackIcon, CrownIcon } from "@/components/icons";
import { MatchCard } from "@/components/MatchCard";
import { QuickShare, SectionTabs, WatchGoals } from "@/components/ResultControls";
import { ShareBar } from "@/components/ShareBar";
import { SharePanel } from "@/components/SharePanel";
import { ShareSheet } from "@/components/ShareSheet";
import { SiuuCelebration } from "@/components/SiuuCelebration";
import { TeamPhoto } from "@/components/TeamPhoto";
import { TOTAL_GOALS, portugalGoals, rankFamous, scoringDayCount } from "@/lib/goals";
import { heroPhotoFor, thumbPhotoFor } from "@/lib/photos";
import type { Team } from "@/lib/schema";
import { competitionLabel } from "@/lib/labels";
import { MATCH_NOTES } from "@/lib/moments";
import { youtubeSearchUrl } from "@/lib/share";
import { SpecialBanner, resultContext } from "./shared";

function listJoin(xs: string[]) {
  if (xs.length <= 1) return xs.join("");
  return `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`;
}

/** Result page for a date with goals (artboard "Yes"). Server component. */
export function YesResult({ mmdd }: { mmdd: string }) {
  const { s, matches, famous, label, url, imagePath, payload } = resultContext(mmdd);
  const n = s.count;
  const record = matches.map((m) => MATCH_NOTES[m.matchId]).find((x) => x?.record);
  const comps = [...new Set(matches.map((m) => competitionLabel(m.competition, m.year).replace(/ \d{4}$/, "")))];
  const firstVideo = matches.find((m) => m.video)?.matchId;
  const fallbackHref = youtubeSearchUrl(famous!);
  // Hero photo: the kit of the day's most famous match (falling back down the ranking if a team has no photo).
  const heroMatch = rankFamous(matches).find((m) => heroPhotoFor(m.team)) ?? null;
  const heroPhoto = heroMatch ? heroPhotoFor(heroMatch.team) : null;
  const avatars = s.teams
    .map((t) => ({ team: t, photo: thumbPhotoFor(t as Team) }))
    .filter((a): a is { team: string; photo: NonNullable<typeof a.photo> } => !!a.photo);

  return (
    <div className="mx-auto max-w-md">
      <SiuuCelebration />

      {/* Hero */}
      <div className="relative h-[300px] overflow-hidden sm:h-[340px]">
        <HeroArt variant="result" photo={heroPhoto} priority />
        {heroMatch && (
          <span className="absolute top-3.5 right-3 rounded-md bg-bg/80 px-2 py-1 text-[11px] font-extrabold tracking-[0.08em] text-text backdrop-blur-sm">
            {heroMatch.team.toUpperCase()} · {heroMatch.year}
          </span>
        )}
        <Link
          href="/"
          aria-label="Back to home"
          className="absolute top-2.5 left-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-bg text-text"
        >
          <BackIcon />
        </Link>
        <div className={`absolute ${heroPhoto ? "right-4 bottom-5" : "inset-0 m-auto"} h-[76px] w-[76px]`}>
          <WatchGoals videoMatchId={firstVideo} fallbackHref={fallbackHref} variant="hero" />
        </div>
        <FlagBar height={6} className="absolute inset-x-0 bottom-0 rounded-none" />
      </div>

      <div className="flex flex-col gap-5 px-4 pt-[18px]">
        {/* One-tap sharing sits right under the hero so it is on the first screen of a phone. */}
        <QuickShare mmdd={mmdd} payload={payload} imagePath={imagePath} />

        <SpecialBanner mmdd={mmdd} />

        {/* Title block */}
        <header className="flex flex-col gap-2.5">
          <div className="flex flex-wrap gap-1.5">
            <span
              data-certified
              className="inline-flex items-center gap-1.5 rounded-md bg-red px-2.5 py-1 text-[11px] font-extrabold tracking-[0.1em] text-white"
            >
              <CrownIcon className="h-3.5 w-3.5" /> CERTIFIED GOAT DAY
            </span>
            <span className="rounded-md bg-green-soft-bg px-2.5 py-1 text-[11px] font-extrabold tracking-[0.1em] text-green-soft-text">
              ONE OF {scoringDayCount()}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            {avatars.length > 0 && (
              <span className="flex -space-x-2" aria-hidden="true">
                {avatars.map((a) => (
                  <span key={a.team} className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-bg">
                    <TeamPhoto photo={a.photo} sizes="32px" decorative />
                  </span>
                ))}
              </span>
            )}
            <p className="eyebrow">YOUR BIRTHDAY · {label.toUpperCase()}</p>
          </div>
          <h1 data-testid="headline" className="font-display text-[52px] uppercase leading-[0.94]">
            Yes! Ronaldo scored{" "}
            <span className="text-red">
              {n} goal{n === 1 ? "" : "s"}
            </span>{" "}
            on your birthday
          </h1>
          <p className="text-[15px] leading-snug text-muted">
            {s.years.length > 1 ? `Across ${s.years.length} different years` : `In ${s.years[0]}`}, for{" "}
            {listJoin(s.teams)}.{record && ` ${record.headline}`}
          </p>
          <p className="flex flex-wrap gap-x-3.5 gap-y-1 text-[13px] font-bold text-muted">
            <span>{s.years.join(" · ")}</span>
            <span>{s.teams.join(" · ")}</span>
            <span>{comps.join(" · ")}</span>
          </p>
        </header>

        <WatchGoals videoMatchId={firstVideo} fallbackHref={fallbackHref} variant="primary" />

        {/* Stats */}
        <dl className="grid grid-cols-3 gap-2">
          {[
            { k: "GOALS", v: n, cls: "text-red" },
            { k: "MATCHES", v: matches.length, cls: "text-green-text" },
            { k: "YEARS", v: s.years.length, cls: "text-text" },
          ].map((x) => (
            <div key={x.k} className="flex flex-col-reverse gap-0.5 rounded-[14px] bg-surface p-3">
              <dt className="text-[11px] font-extrabold tracking-[0.1em] text-muted">{x.k}</dt>
              <dd className={`font-display text-4xl leading-none ${x.cls}`}>{x.v}</dd>
            </div>
          ))}
        </dl>

        <SectionTabs />

        <section id="episodes" aria-labelledby="episodes-h" className="flex scroll-mt-14 flex-col gap-5">
          <h2 id="episodes-h" className="sr-only">
            Episodes: every goal on {label}
          </h2>
          {matches.map((m, i) => (
            <MatchCard
              key={m.matchId}
              m={m}
              index={i + 1}
              mmdd={mmdd}
              note={MATCH_NOTES[m.matchId]}
              pageUrl={url}
              label={label}
            />
          ))}
        </section>

        <SharePanel
          mmdd={mmdd}
          url={url}
          payload={payload}
          preview={{ label: label.toUpperCase(), count: n }}
          imagePath={imagePath}
        />

        <section id="calendar" aria-labelledby="calendar-h" className="scroll-mt-14 rounded-[18px] bg-surface p-4">
          <h2 id="calendar-h" className="mb-3 text-base font-extrabold">
            Your birthday on Ronaldo&apos;s calendar
          </h2>
          <GoalCalendar highlight={mmdd} legend />
        </section>

        <section
          id="verdict"
          aria-labelledby="verdict-h"
          className="scroll-mt-14 overflow-hidden rounded-[18px] bg-surface"
        >
          <FlagBar height={6} className="rounded-none" />
          <div className="flex flex-col gap-1.5 p-[18px]">
            <p className="eyebrow">The verdict</p>
            <h2 id="verdict-h" className="font-display text-[40px] uppercase leading-none">
              Greatest of all time.
            </h2>
            <p className="text-sm leading-snug text-muted">
              Cristiano Ronaldo: {TOTAL_GOALS} official goals, the most in men&apos;s football history.{" "}
              {portugalGoals()} for Portugal, the most international goals ever. Five Champions League titles. Case
              closed.
            </p>
          </div>
        </section>

        <Link
          href="/"
          className="flex min-h-14 items-center justify-center rounded-xl border-2 border-border font-display text-xl uppercase tracking-[0.03em]"
        >
          Check a friend&apos;s birthday
        </Link>
      </div>

      <ShareBar
        mmdd={mmdd}
        payload={payload}
        imagePath={imagePath}
        watch={{ videoMatchId: firstVideo, href: fallbackHref }}
      />
      <ShareSheet />
    </div>
  );
}
