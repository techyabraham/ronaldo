import Link from "next/link";
import { FlagBar } from "@/components/FlagBar";
import { GoalCalendar } from "@/components/GoalCalendar";
import { HeroArt } from "@/components/HeroArt";
import { BackIcon, CrownIcon } from "@/components/icons";
import { MatchCard } from "@/components/MatchCard";
import { ResultActions, SectionTabs, WatchGoals } from "@/components/ResultControls";
import { ShareBar } from "@/components/ShareBar";
import { ShareNudge } from "@/components/ShareNudge";
import { SharePanel } from "@/components/SharePanel";
import { SiuuCelebration } from "@/components/SiuuCelebration";
import { TOTAL_GOALS, portugalGoals, scoringDayCount } from "@/lib/goals";
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
  const { s, matches, famous, label, url, imagePath, text } = resultContext(mmdd);
  const n = s.count;
  const record = matches.map((m) => MATCH_NOTES[m.matchId]).find((x) => x?.record);
  const comps = [...new Set(matches.map((m) => competitionLabel(m.competition, m.year).replace(/ \d{4}$/, "")))];
  const firstVideo = matches.find((m) => m.video)?.matchId;
  const fallbackHref = youtubeSearchUrl(famous!);

  return (
    <div className="mx-auto max-w-md">
      <SiuuCelebration />

      {/* Hero */}
      <div className="relative h-[300px] overflow-hidden">
        <HeroArt variant="result" />
        <Link
          href="/"
          aria-label="Back to home"
          className="absolute top-2.5 left-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-bg text-text"
        >
          <BackIcon />
        </Link>
        <div className="absolute inset-0 m-auto h-[76px] w-[76px]">
          <WatchGoals videoMatchId={firstVideo} fallbackHref={fallbackHref} variant="hero" />
        </div>
        <FlagBar height={6} className="absolute inset-x-0 bottom-0 rounded-none" />
      </div>

      <div className="flex flex-col gap-5 px-4 pt-[18px]">
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
          <p className="eyebrow">YOUR BIRTHDAY · {label.toUpperCase()}</p>
          <h1 data-testid="headline" className="font-display text-[52px] uppercase leading-[0.94]">
            The GOAT scored{" "}
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

        <ResultActions mmdd={mmdd} url={url} text={text} videoMatchId={firstVideo} fallbackHref={fallbackHref} />

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

        <SharePanel
          mmdd={mmdd}
          url={url}
          text={text}
          preview={{ label: label.toUpperCase(), count: n }}
          imagePath={imagePath}
        />

        <SectionTabs />

        <section id="episodes" aria-labelledby="episodes-h" className="flex scroll-mt-14 flex-col gap-5">
          <h2 id="episodes-h" className="sr-only">
            Episodes: every goal on {label}
          </h2>
          {matches.map((m, i) => (
            <div key={m.matchId} className="flex flex-col gap-5">
              <MatchCard m={m} index={i + 1} mmdd={mmdd} note={MATCH_NOTES[m.matchId]} />
              {i === 0 && matches.length > 1 && (
                <ShareNudge
                  mmdd={mmdd}
                  url={url}
                  text={text}
                  placement="nudge-mid"
                  title={`${n} goal${n === 1 ? "" : "s"} on your birthday. Your group chat needs to see this.`}
                />
              )}
            </div>
          ))}
        </section>

        <section id="calendar" aria-labelledby="calendar-h" className="scroll-mt-14 rounded-[18px] bg-surface p-4">
          <h2 id="calendar-h" className="mb-3 text-base font-extrabold">
            Your day on the GOAT calendar
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
              {TOTAL_GOALS} official goals — the most in men&apos;s football history. {portugalGoals()} for Portugal,
              the most international goals ever. Five Champions League titles. Case closed.
            </p>
          </div>
        </section>

        <ShareNudge
          mmdd={mmdd}
          url={url}
          text={text}
          placement="nudge-end"
          title={`Think a friend can beat ${n}? Challenge them.`}
        />

        <Link
          href="/"
          className="flex min-h-14 items-center justify-center rounded-xl border-2 border-border font-display text-xl uppercase tracking-[0.03em]"
        >
          Check a friend&apos;s birthday
        </Link>
      </div>

      <ShareBar mmdd={mmdd} url={url} text={text} imagePath={imagePath} />
    </div>
  );
}
