import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Confetti } from "@/components/Confetti";
import { MatchCard } from "@/components/MatchCard";
import { ShareBar } from "@/components/ShareBar";
import { ALL_MMDD, formatMmdd, isValidMmdd } from "@/lib/dates";
import { matchesForDate, nearestScoringDays, summarise } from "@/lib/goals";
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

      <div className="mx-auto max-w-xl px-4">
        {s.count > 0 ? (
          <section aria-label={`Goals on ${label}`} className="space-y-4">
            {matches.map((m) => (
              <MatchCard key={m.matchId} m={m} mmdd={mmdd} />
            ))}
          </section>
        ) : (
          <NearestDays mmdd={mmdd} />
        )}

        <Link
          href="/"
          className="mt-8 flex min-h-14 w-full items-center justify-center rounded-2xl border-2 border-gold font-black uppercase text-gold"
        >
          Check another date
        </Link>
        <a
          href={`/birthday/${mmdd}/square`}
          download={`ronaldo-${mmdd}.png`}
          className="mt-3 flex min-h-12 w-full items-center justify-center rounded-2xl border border-border bg-surface font-bold"
        >
          <span aria-hidden="true">🖼️</span>&nbsp;Save image for your status
        </a>
      </div>

      <ShareBar mmdd={mmdd} count={s.count} url={url} />
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
