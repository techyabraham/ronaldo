import type { Metadata } from "next";
import { DATA_UPDATED, LATEST_GOAL_DATE, TOTAL_GOALS } from "@/lib/goals";
import { CORRECTIONS_URL, CREATOR, DISCLAIMER, SITE_URL } from "@/lib/site";
import { ABOUT_DESCRIPTION, ABOUT_TITLE, socialMeta, withBrand } from "@/lib/seo";
import { FlagBar } from "@/components/FlagBar";
import { JsonLd } from "@/components/JsonLd";
import { aboutGraph } from "@/lib/jsonld";
import { TabBar } from "@/components/TabBar";

export const metadata: Metadata = {
  title: ABOUT_TITLE,
  description: ABOUT_DESCRIPTION,
  ...socialMeta({ title: withBrand(ABOUT_TITLE), description: ABOUT_DESCRIPTION, path: "/about", homeImage: true }),
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
    <>
      <article className="mx-auto max-w-md px-4 pt-6 leading-relaxed text-[15px] [&_a]:text-red-text [&_a]:underline [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-extrabold [&_li]:mt-1">
        <p className="eyebrow">The small print</p>
        <h1 className="mt-1 font-display text-5xl uppercase leading-[0.94]">About GOAT Day</h1>
        <FlagBar className="mt-4 w-24" />
        <p className="mt-4 text-muted">
          Pick a birthday and we show every official goal Cristiano Ronaldo has scored on that calendar day, in any
          year.
        </p>

        <h2 id="what-counts" className="scroll-mt-4">
          What counts
        </h2>
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
            Disputed goals are kept and labelled. Example: the 23 October 2026 header vs Al Faisaly is credited to
            Ronaldo by the Saudi Pro League but recorded as an own goal by some stats providers.
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
            Al Nassr goals from March 2023: Wikipedia&apos;s Al-Nassr season articles (CC BY-SA 4.0), checked against
            the club career totals on{" "}
            <a href="https://en.wikipedia.org/wiki/Cristiano_Ronaldo#Career_statistics">Cristiano Ronaldo</a>.
          </li>
          <li>
            Videos are embedded with YouTube&apos;s official player and belong to their owners. We never download or
            re-host video.
          </li>
        </ul>

        <h2>Spotted a mistake?</h2>
        <p>
          <a href={CORRECTIONS_URL}>Report a correction</a> with the date, the match and a source, and we&apos;ll fix
          it.
        </p>

        <h2>Who made this</h2>
        <p>
          Built by{" "}
          <a href={CREATOR.portfolioUrl} rel="author noopener">
            {CREATOR.name}
          </a>
          . Say hi on X:{" "}
          <a href={CREATOR.xUrl} rel="me noopener">
            @{CREATOR.handle}
          </a>
          .
        </p>

        <h2>Disclaimer</h2>
        <p className="text-muted">{DISCLAIMER}</p>
      </article>
      <TabBar url={`${SITE_URL}/`} />
      <JsonLd data={aboutGraph()} />
    </>
  );
}
