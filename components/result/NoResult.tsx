import Link from "next/link";
import { EpisodeTile } from "@/components/EpisodeTile";
import { FlagBar } from "@/components/FlagBar";
import { GoalCalendar } from "@/components/GoalCalendar";
import { BackIcon, PlayIcon } from "@/components/icons";
import { QuickShare } from "@/components/ResultControls";
import { ShareBar } from "@/components/ShareBar";
import { SharePanel } from "@/components/SharePanel";
import { ShareSheet } from "@/components/ShareSheet";
import { youtubeSearchUrl } from "@/lib/share";
import { TeamPhoto } from "@/components/TeamPhoto";
import { shortLabel } from "@/lib/dates";
import { thumbPhotoFor } from "@/lib/photos";
import { excuseFor } from "@/lib/excuses";
import { nearestScoringDays, restDayCount, scoringDayCount } from "@/lib/goals";
import { SpecialBanner, resultContext } from "./shared";

/** Result page for a date he has never scored on (artboard "No"). Server component. */
export function NoResult({ mmdd }: { mmdd: string }) {
  const { label, url, imagePath, payload } = resultContext(mmdd);
  const near = nearestScoringDays(mmdd);
  const excuse = excuseFor(mmdd, { count: 0, before: near.before, after: near.after })!;
  const rest = restDayCount();
  const [mm, dd] = mmdd.split("-");
  const upNext = [
    near.after && { ...near.after, dir: "AFTER" as const, tone: "green" as const },
    near.before && { ...near.before, dir: "BEFORE" as const, tone: "red" as const },
  ].filter((x): x is NonNullable<typeof x> => !!x);

  return (
    <div className="mx-auto max-w-md">
      <div className="flex flex-col gap-5 px-4 pt-1">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-text">
            <BackIcon /> Another date
          </Link>
          <span className="eyebrow">
            {dd} · {mm}
          </span>
        </div>

        <SpecialBanner mmdd={mmdd} />

        {/* Rest-day card */}
        <header className="overflow-hidden rounded-[20px] bg-surface">
          <FlagBar height={6} className="rounded-none" />
          {/* Greyscale "off duty" photo that fades into the card */}
          <div className="relative h-[150px] sm:h-[230px]" aria-hidden="true">
            <TeamPhoto photo="rest" sizes="(max-width: 448px) 100vw, 448px" grayscale decorative />
            <div className="absolute inset-0 bg-gradient-to-b from-surface/10 via-surface/30 to-surface" />
            <span className="absolute top-3 right-3 rounded-md bg-bg/80 px-2 py-1 text-[11px] font-extrabold tracking-[0.08em] text-muted">
              OFF DUTY
            </span>
          </div>
          <div className="relative -mt-14 flex flex-col gap-2.5 p-[18px] pt-0">
            <span className="w-fit rounded-md bg-green-soft-bg px-2.5 py-1 text-[11px] font-extrabold tracking-[0.1em] text-green-soft-text">
              RARE · 1 OF {rest}
            </span>
            <p className="eyebrow">YOUR BIRTHDAY · {label.toUpperCase()}</p>
            <p aria-hidden="true" className="font-display text-[92px] uppercase leading-[0.88]">
              Rest
              <br />
              day.
            </p>
            <h1 data-testid="headline" className="text-xl font-extrabold leading-snug">
              Ronaldo has never scored on your birthday
            </h1>
            <p className="text-[15px] leading-snug text-muted">
              Even the GOAT takes a day off, and he chose yours. He has scored on {scoringDayCount()} of 366 dates.
              Yours is one of only {rest} he has never touched.
            </p>
          </div>
        </header>

        {/* One-tap sharing right after the answer, so it is on the first screen of a phone. */}
        <QuickShare mmdd={mmdd} payload={payload} imagePath={imagePath} />

        {/* The official excuse */}
        <section aria-labelledby="excuse-h" className="rounded-[20px] border border-border p-[18px]">
          <p className="eyebrow">The official excuse</p>
          <h2 id="excuse-h" className="mt-1 font-display text-[32px] uppercase leading-none">
            {excuse.title}
          </h2>
          <p className="mt-2 text-[15px] leading-snug text-text">{excuse.line}</p>
        </section>

        <section aria-labelledby="next-h" className="flex flex-col gap-3">
          <h2 id="next-h" className="text-lg font-extrabold">
            So close: Ronaldo&apos;s nearest goals
          </h2>
          {upNext.map((d) => (
            <div key={d.mmdd} className="flex items-center gap-2">
              <Link href={`/birthday/${d.mmdd}`} className="flex min-w-0 flex-1 items-center gap-3 text-text">
                <EpisodeTile
                  tone={d.tone}
                  photo={thumbPhotoFor(d.team)}
                  photoSizes="130px"
                  className="h-[74px] w-[130px] flex-none"
                >
                  <span className="absolute bottom-2 left-2.5 font-display text-[26px] leading-none">
                    {shortLabel(d.mmdd)}
                  </span>
                </EpisodeTile>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="sr-only">{d.label}: </span>
                  <span
                    className={`text-xs font-extrabold tracking-[0.08em] ${d.dir === "AFTER" ? "text-green-text" : "text-red-text"}`}
                  >
                    {d.offset} DAY{d.offset === 1 ? "" : "S"} {d.dir}
                  </span>
                  <span className="text-[15px] font-extrabold leading-tight">{d.headline}</span>
                  <span className="text-xs text-muted">
                    {d.count} goal{d.count === 1 ? "" : "s"}
                  </span>
                </span>
              </Link>
              <a
                href={youtubeSearchUrl(d)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Watch Ronaldo vs ${d.opponent}, ${d.year} on YouTube`}
                className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-red text-white"
              >
                <PlayIcon className="ml-0.5 h-4 w-4" />
              </a>
            </div>
          ))}
        </section>

        <SharePanel
          mmdd={mmdd}
          url={url}
          payload={payload}
          preview={{ label: label.toUpperCase(), count: 0 }}
          imagePath={imagePath}
        />

        <section aria-labelledby="calendar-h" className="rounded-[18px] bg-surface p-4">
          <h2 id="calendar-h" className="mb-3 text-base font-extrabold">
            Your birthday on Ronaldo&apos;s calendar
          </h2>
          <GoalCalendar highlight={mmdd} legend />
        </section>

        <div>
          <Link
            href="/"
            className="flex min-h-14 items-center justify-center rounded-xl border-2 border-border font-display text-xl uppercase tracking-[0.03em]"
          >
            Check a friend&apos;s birthday
          </Link>
        </div>
      </div>

      <ShareBar
        mmdd={mmdd}
        payload={payload}
        imagePath={imagePath}
        watch={{
          href: near.after
            ? youtubeSearchUrl(near.after)
            : "https://www.youtube.com/results?search_query=Cristiano+Ronaldo+goals",
        }}
      />
      <ShareSheet />
    </div>
  );
}
