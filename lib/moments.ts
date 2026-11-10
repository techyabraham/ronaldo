import type { Team } from "./schema";

/**
 * Hand-written context for famous matches. Copy only; every number here is either derived from
 * data/goals.json (and unit-tested against it) or one of the brief's static facts.
 */
export type MatchNote = { headline: string; record?: boolean };

export const MATCH_NOTES: Record<string, MatchNote> = {
  "2021-06-23-france": {
    record: true,
    headline: "Goal 109 for Portugal made him the top scorer in men's international football, passing Ali Daei.",
  },
  "2018-06-15-spain": {
    headline: "A World Cup hat-trick against Spain, finished with an 88th-minute free kick.",
  },
  "2019-03-12-atletico-madrid": {
    headline: "A Champions League hat-trick that overturned a 2–0 first-leg defeat.",
  },
  "2017-06-03-juventus": {
    headline: "Two goals in the Champions League final in Cardiff.",
  },
};

export type GoatMoment = { matchId: string; team: Team; title: string; subtitle: string; href: string };

const moment = (matchId: string, team: Team, title: string, subtitle: string): GoatMoment => ({
  matchId,
  team,
  title,
  subtitle,
  href: `/birthday/${matchId.slice(5, 10)}`,
});

/** Home-page Top 3, in this order. */
export const GOAT_MOMENTS: GoatMoment[] = [
  moment("2018-06-15-spain", "Portugal", "Hat-trick vs Spain", "15 Jun 2018 · World Cup · free kick at 88′"),
  moment("2019-03-12-atletico-madrid", "Juventus", "Hat-trick vs Atlético", "12 Mar 2019 · Champions League comeback"),
  moment("2021-06-23-france", "Portugal", "Goal 109 — world record", "23 Jun 2021 · Euro 2020 vs France"),
];
