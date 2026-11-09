import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Confetti } from "@/components/Confetti";
import { MatchCard } from "@/components/MatchCard";
import { ShareBar } from "@/components/ShareBar";
import { ShareNudge } from "@/components/ShareNudge";
import { SharePanel, type SharePreview } from "@/components/SharePanel";
import { ALL_MMDD, formatMmdd, isValidMmdd } from "@/lib/dates";
import { matchesForDate, nearestScoringDays, pickFamous, summarise } from "@/lib/goals";
import { highlightPhrase, shareText, type ShareMatch } from "@/lib/share";
import { SITE_URL } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_MMDD.map((mmdd) => ({ mmdd }));
}

function listJoin(xs: string[]) {
  if (xs.length <= 1) return xs.join("");
  return `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`;
}

export async function generateMetadata({ params }: PageProps<"/birthday/[mmdd]">): Promise<Metadata> {
  const { mmdd } = await params;
  if (!isValidMmdd(mmdd)) return {};
  const s = summarise(mmdd);
  const title = `Did Ronaldo score on ${s.label}? ${s.count ? `Yes — ${s.count} goal${s.count === 1 ? "" : "s"}` : "Not this day"}`;
  const description = s.count
    ? `Cristiano Ronaldo scored ${s.count} official goal${s.count === 1 ? "" : "s"} on ${s.label}, for ${listJoin(s.teams)} (${s.years.join(", ")}). Watch them and check your own birthday.`
    : `Cristiano Ronaldo has never scored an official goal on ${s.label}. See the nearest days he did, and check your own birthday.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/birthday/${mmdd}` },
    openGraph: { title, description, url: `/birthday/${mmdd}`, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BirthdayPage({ params }: PageProps<"/birthday/[mmdd]">) {
  const { mmdd } = await params;
  if (!isValidMmdd(mmdd)) notFound();
  const s = summarise(mmdd);
  const matches = matchesForDate(mmdd);
  const label = formatMmdd(mmdd);
  const url = `${SITE_URL}/birthday/${mmdd}`;
  const isHisBirthday = mmdd === "02-05";
  const isLeap = mmdd === "02-29";

  // Everything the share UI needs is computed here at build time; the client only gets strings.
  const famous = matches.length ? pickFamous(matches) : null;
  const highlight: ShareMatch | null = famous
    ? {
        opponent: famous.opponent,
        year: famous.year,
        competition: famous.competition,
        stage: famous.stage,
        goals: famous.goals.length,
      }
    : null;
  const text = shareText({ count: s.count, label, highlight, hisBirthday: isHisBirthday });
  const near = s.count ? null : nearestScoringDays(mmdd);
  const preview: SharePreview = {
    label: label.toUpperCase(),
    yes: s.count > 0,
    big: s.count ? `YES: ${s.count} GOAL${s.count === 1 ? "" : "S"}` : "NOT THIS DAY",
    small: highlight
      ? `Including ${highlightPhrase(highlight)}`
      : near?.after
        ? `But he scored ${near.after.offset} day${near.after.offset === 1 ? "" : "s"} later, ${near.after.headline}`
        : "",
  };
  const nudgeTitle = s.count
    ? `📣 ${s.count} goal${s.count === 1 ? "" : "s"} on your birthday. Your group chat needs to see this.`
    : "📣 Know someone born on another day? Send it and see if Ronaldo scored on theirs.";

  return (
    <div className="bg-pitch">
      {s.count > 0 && <Confetti />}
      <div className="mx-auto max-w-xl px-4 pt-6 pb-6">
        {isHisBirthday && (
          <p className="mb-4 rounded-2xl bg-gold px-4 py-3 text-center font-black text-gold-ink">
            🎂 Happy birthday to you AND Cristiano! (born 5 February 1985)
          </p>
        )}
        {isLeap && (
          <p className="mb-4 rounded-2xl border border-gold px-4 py-3 text-center font-bold">
            🐸 A leap-year baby! Your birthday only comes round every four years, so the odds were always tough.
          </p>
        )}

        {s.count > 0 ? (
          <header>
            <h1 className="text-4xl font-black leading-[0.95] tracking-tight sm:text-5xl" data-testid="headline">
              YES! Ronaldo scored <span className="text-gold">{s.count}</span> goal{s.count === 1 ? "" : "s"} on {label}{" "}
              <span aria-hidden="true">🐐</span>
            </h1>
            <p className="mt-3 text-lg text-muted">
              {s.years.length > 1 ? `Across ${s.years.length} different years` : `In ${s.years[0]}`}, for{" "}
              {listJoin(s.teams)}.
            </p>
          </header>
        ) : (
          <header>
            <h1 className="text-4xl font-black leading-[0.95] tracking-tight sm:text-5xl" data-testid="headline">
              Not on your birthday <span aria-hidden="true">😅</span>
            </h1>
            <p className="mt-3 text-lg text-muted">
              In {new Date().getFullYear() - 2002} years of goals, Ronaldo has never scored an official goal on {label}.
              It&apos;s one of the rare days he missed.
            </p>
          </header>
        )}
      </div>

      <div className="mx-auto max-w-xl space-y-4 px-4">
        <SharePanel mmdd={mmdd} url={url} text={text} preview={preview} />

        {s.count > 0 ? (
          <section aria-label={`Goals on ${label}`} className="space-y-4 pt-4">
            <h2 className="text-xl font-black">Every goal on {label}</h2>
            {matches.map((m, i) => (
              <div key={m.matchId} className="space-y-4">
                <MatchCard m={m} mmdd={mmdd} />
                {i === 0 && matches.length > 1 && (
                  <ShareNudge mmdd={mmdd} url={url} text={text} title={nudgeTitle} placement="nudge-mid" />
                )}
              </div>
            ))}
          </section>
        ) : (
          <NearestDays mmdd={mmdd} />
        )}

        <ShareNudge
          mmdd={mmdd}
          url={url}
          text={text}
          placement="nudge-end"
          title={
            s.count
              ? `🏆 Think a friend can beat ${s.count} goal${s.count === 1 ? "" : "s"}? Challenge them.`
              : "🤝 Find out who in your group shares a birthday with a Ronaldo goal."
          }
        />

        <Link
          href="/"
          className="flex min-h-14 w-full items-center justify-center rounded-2xl border-2 border-gold font-black uppercase text-gold"
        >
          Check another date
        </Link>
      </div>

      <ShareBar mmdd={mmdd} url={url} text={text} />
    </div>
  );
}

function NearestDays({ mmdd }: { mmdd: string }) {
  const { before, after } = nearestScoringDays(mmdd);
  const items = [
    after && { ...after, when: `${after.offset} day${after.offset === 1 ? "" : "s"} later` },
    before && { ...before, when: `${before.offset} day${before.offset === 1 ? "" : "s"} earlier` },
  ].filter(Boolean) as ((typeof after & {}) & { when: string })[];
  return (
    <section aria-labelledby="nearest" className="rounded-3xl border border-border bg-surface p-5">
      <h2 id="nearest" className="text-xl font-black">
        …but he came close
      </h2>
      <ul className="mt-3 space-y-3">
        {items.map((d) => (
          <li key={d.mmdd}>
            <Link
              href={`/birthday/${d.mmdd}`}
              className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-3"
            >
              <span>
                <span className="block font-black">
                  {d.when}: {d.label}
                </span>
                <span className="block text-sm text-muted">
                  {d.count} goal{d.count === 1 ? "" : "s"}, including {d.headline}
                </span>
              </span>
              <span aria-hidden="true" className="text-gold text-xl">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
