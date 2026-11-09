import type { Metadata } from "next";
import { DATA_UPDATED, LATEST_GOAL_DATE, TOTAL_GOALS } from "@/lib/goals";
import { CORRECTIONS_URL, DISCLAIMER } from "@/lib/site";

export const metadata: Metadata = {
  title: "About & data sources",
  description:
    "How we count Cristiano Ronaldo's official goals, where the data comes from, and how to report a correction.",
  alternates: { canonical: "/about" },
};

function fmt(iso: string) {
  return new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function About() {
  return (
    <article className="mx-auto max-w-xl px-4 pt-8 leading-relaxed [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-black [&_a]:underline [&_li]:mt-1">
      <h1 className="text-4xl font-black tracking-tight">About</h1>
      <p className="mt-4 text-muted">
        Pick a birthday and we show every official goal Cristiano Ronaldo has scored on that calendar day, in any year.
      </p>

      <h2>What counts</h2>
      <ul className="list-disc pl-5">
        <li>
          <strong>Official senior goals only</strong>: {TOTAL_GOALS} in total (club and Portugal), the same definition
          used by his clubs, leagues and FIFA.
        </li>
        <li>
          Youth-team goals, friendlies between clubs and penalty-shootout kicks don&apos;t count. Extra-time goals do.
        </li>
        <li>
          Dates are the <strong>local date where the match was played</strong>, never converted to your time zone.
        </li>
        <li>
          Disputed goals are kept and labelled. Example: the 23 October 2026 header vs Al Faisaly is credited to Ronaldo
          by the Saudi Pro League but recorded as an own goal by some stats providers.
        </li>
      </ul>

      <h2>Last updated</h2>
      <p>
        Data checked on {fmt(DATA_UPDATED)}. Latest goal included: {fmt(LATEST_GOAL_DATE)}. Ronaldo retired from
        international football on 5 November 2026, so his 146 goals for Portugal are final.
      </p>

      <h2>Sources &amp; licences</h2>
      <ul className="list-disc pl-5">
        <li>
          Portugal goals:{" "}
          <a href="https://en.wikipedia.org/wiki/List_of_international_goals_scored_by_Cristiano_Ronaldo">
            List of international goals scored by Cristiano Ronaldo
          </a>{" "}
          (Wikipedia, CC BY-SA 4.0).
        </li>
        <li>
          Club goals 2002 to March 2023:{" "}
          <a href="https://www.kaggle.com/datasets/azminetoushikwasi/lionel-messi-vs-cristiano-ronaldo-club-goals">
            Lionel Messi vs Cristiano Ronaldo | Club Goals
          </a>{" "}
          by Azmine Toushik Wasi (Open Database License). Our combined goal list is likewise available under the{" "}
          <a href="https://opendatacommons.org/licenses/odbl/1-0/">ODbL</a>.
        </li>
        <li>
          Al Nassr goals from March 2023: Wikipedia&apos;s Al-Nassr season articles (CC BY-SA 4.0), checked against the
          club career totals on{" "}
          <a href="https://en.wikipedia.org/wiki/Cristiano_Ronaldo#Career_statistics">Cristiano Ronaldo</a>.
        </li>
        <li>
          Videos are embedded with YouTube&apos;s official player and belong to their owners. We never download or
          re-host video.
        </li>
      </ul>

      <h2>Spotted a mistake?</h2>
      <p>
        <a href={CORRECTIONS_URL}>Report a correction</a> with the date, the match and a source, and we&apos;ll fix it.
      </p>

      <h2>Disclaimer</h2>
      <p className="text-muted">{DISCLAIMER}</p>
    </article>
  );
}
