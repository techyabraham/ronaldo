import Link from "next/link";
import { EpisodeTile } from "@/components/EpisodeTile";
import { FlagBar } from "@/components/FlagBar";
import { GoalCalendar } from "@/components/GoalCalendar";
import { BackIcon } from "@/components/icons";
import { PostButton } from "@/components/ResultControls";
import { ShareBar } from "@/components/ShareBar";
import { ShareNudge } from "@/components/ShareNudge";
import { SharePanel } from "@/components/SharePanel";
import { shortLabel } from "@/lib/dates";
import { excuseFor } from "@/lib/excuses";
import { nearestScoringDays, restDayCount, scoringDayCount } from "@/lib/goals";
import { SpecialBanner, resultContext } from "./shared";

/** Result page for a date he has never scored on (artboard "No"). Server component. */
export function NoResult({ mmdd }: { mmdd: string }) {
  const { label, url, imagePath, text } = resultContext(mmdd);
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
          <div className="flex flex-col gap-2.5 p-[18px]">
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
              Even the GOAT takes a day off. He chose yours.
            </h1>
            <p className="text-[15px] leading-snug text-muted">
              He has scored on {scoringDayCount()} of 366 dates. Yours is one of only {rest} he has never touched.
            </p>
          </div>
        </header>

        {/* The official excuse */}
        <section aria-labelledby="excuse-h" className="rounded-[20px] border border-border p-[18px]">
          <p className="eyebrow">The official excuse</p>
          <h2 id="excuse-h" className="mt-1 font-display text-[32px] uppercase leading-none">
            {excuse.title}
          </h2>
          <p className="mt-2 text-[15px] leading-snug text-text">{excuse.line}</p>
        </section>

        <SharePanel
          mmdd={mmdd}
          url={url}
          text={text}
          preview={{ label: label.toUpperCase(), count: 0 }}
          imagePath={imagePath}
        />

        <section aria-labelledby="calendar-h" className="rounded-[18px] bg-surface p-4">
          <h2 id="calendar-h" className="mb-3 text-base font-extrabold">
            Your rest day on the GOAT calendar
          </h2>
          <GoalCalendar highlight={mmdd} legend />
        </section>

        <section aria-labelledby="next-h" className="flex flex-col gap-3">
          <h2 id="next-h" className="text-lg font-extrabold">
            Up next on the GOAT calendar
          </h2>
          {upNext.map((d) => (
            <Link key={d.mmdd} href={`/birthday/${d.mmdd}`} className="flex items-center gap-3 text-text">
              <EpisodeTile tone={d.tone} className="h-[74px] w-[130px] flex-none">
                <span className="absolute bottom-2 left-2.5 font-display text-[26px] leading-none">
                  {shortLabel(d.mmdd)}
                </span>
              </EpisodeTile>
              <span className="flex min-w-0 flex-col gap-0.5">
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
          ))}
        </section>

        <ShareNudge
          mmdd={mmdd}
          url={url}
          text={text}
          placement="nudge-end"
          title="Find out who in your group got a GOAT Day."
        />

        <div>
          <PostButton mmdd={mmdd} url={url} text={text} imagePath={imagePath} label="Post my rare day" />
          <Link
            href="/"
            className="mt-3 flex min-h-14 items-center justify-center rounded-xl border-2 border-border font-display text-xl uppercase tracking-[0.03em]"
          >
            Check a friend&apos;s birthday
          </Link>
        </div>
      </div>

      <ShareBar mmdd={mmdd} url={url} text={text} imagePath={imagePath} label="Post my rare day" />
    </div>
  );
}
