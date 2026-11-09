/**
 * "The official excuse": a deliberately ridiculous, affectionate reason why the GOAT didn't score on a date.
 *
 * Rules for writing these:
 *  - obviously a joke; never claim a real injury, suspension or event happened on that date;
 *  - no invented stats, no digs at other players;
 *  - any real number (like "2 days later") comes from the data via `nearest`.
 *
 * Deterministic: the same date always gets the same excuse (static pages, shareable images).
 */
export type Excuse = { title: string; line: string };
export type NearbyDay = { label: string; offset: number };
export type ExcuseContext = { count: number; before?: NearbyDay | null; after?: NearbyDay | null };

/** One-off dates with their own excuse. */
const SPECIFIC: Record<string, Excuse> = {
  "01-01": {
    title: "New Year's Day",
    line: "Nobody scores on New Year's Day. The GOAT was busy doing a recovery session for the entire planet.",
  },
  "01-02": {
    title: "Rest day from the rest day",
    line: "1 January was a rest day. This is the rest day from that. Recovery is a science, and he has a PhD.",
  },
  "12-24": {
    title: "Christmas Eve",
    line: "Santa asked for one night without the competition. The GOAT, a gentleman, agreed.",
  },
  "12-25": {
    title: "Christmas Day",
    line: "Even the GOAT lets the turkey take the headlines once a year.",
  },
  "12-28": {
    title: "The festive fog",
    line: "Between Christmas and New Year nobody knows what day it is. Not even the GOAT. Especially not the GOAT.",
  },
  "02-05": {
    title: "His own birthday",
    line: "You don't score on your birthday. You receive the gifts. Even the GOAT follows the rules on that one.",
  },
  "02-29": {
    title: "Leap day",
    line: "This date shows up one year in four. The GOAT doesn't do part-time.",
  },
};

/** Seasonal windows: football's calendar does a lot of the excusing for us. */
const WINDOWS: { test: (m: number, d: number) => boolean; title: string; lines: string[] }[] = [
  {
    title: "Off-season",
    test: (m) => m === 7,
    lines: [
      "July. He was on a yacht, staring at the sea like it owed him a goal.",
      "Summer break. Somewhere, a beach was getting the GOAT treatment: sprints at sunrise, zero ice cream.",
      "July is for recharging. You don't break records on a flat battery.",
      "Off-season. He was doing sit-ups that would make a washboard jealous.",
    ],
  },
  {
    title: "Season's over",
    test: (m, d) => (m === 5 && d >= 18) || m === 6,
    lines: [
      "Season's over. Those trophies don't polish themselves.",
      "End of the season. Somebody had to pose for all the trophy photos.",
      "Early summer. The big tournaments don't start until the GOAT says they start.",
      "June. He was resting the legs for whatever record he was about to break next.",
      "Summer holidays. Even the GOAT has to let the rest of the world catch up for a few weeks.",
    ],
  },
  {
    title: "International break",
    test: (m, d) =>
      (m === 3 && d >= 13) || (m === 11 && d >= 10 && d <= 20) || (m === 9 && d <= 10) || (m === 10 && d <= 14),
    lines: [
      "International break admin. Somebody had to sign all those shirts.",
      "Travel day. He spent it teaching the airport how to walk faster.",
      "Squad photo day. It takes a while when one player insists on perfect lighting.",
    ],
  },
  {
    title: "Pre-season",
    test: (m) => m === 8,
    lines: [
      "Pre-season friendlies don't count, and he refuses to waste a Siuu on one.",
      "August. Still warming up. Literally. The man stretches for a month.",
      "Pre-season. The boots were new and he didn't want to scuff them.",
    ],
  },
];

/** Everything else. `{after}` / `{before}` lines only apply when the data has a nearby goal. */
const GENERIC: ((c: ExcuseContext) => string | null)[] = [
  (c) =>
    c.after
      ? `He was saving it for ${c.after.label}, ${days(c.after.offset)} later. Patience is part of greatness.`
      : null,
  (c) =>
    c.before
      ? `He'd just scored ${days(c.before.offset)} earlier, on ${c.before.label}. Even the GOAT needs a cool-down.`
      : null,
  () => "He looked at the calendar, saw it was your birthday, and decided the spotlight should be all yours.",
  () => "Goalkeepers everywhere asked for one day of peace. He granted it. He chose yours.",
  () => "The ball was still recovering from the last one.",
  () => "Word is he was in the gym. Every rumour about him is that he was in the gym.",
  () => "Even GOATs blink.",
  () => "He was practising free kicks into a bin from 30 yards. For fun. Nobody told him there was a match.",
  () => "The net asked for a day off. Union rules.",
  () => "He was busy negotiating to own the rest of the calendar. It's going well.",
  () => "He took the day off so the record books could catch their breath.",
  () => "The GOAT doesn't miss. He was simply resting the fans' voices for the next Siuu.",
];

function days(n: number) {
  return `${n} day${n === 1 ? "" : "s"}`;
}

/** Small stable string hash (FNV-1a), so each date picks the same line every build. */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The official excuse for a date he has never scored on; null on scoring days. */
export function excuseFor(mmdd: string, ctx: ExcuseContext): Excuse | null {
  if (ctx.count > 0) return null;
  if (SPECIFIC[mmdd]) return SPECIFIC[mmdd];
  const [m, d] = mmdd.split("-").map((x) => parseInt(x, 10));
  const h = hash(mmdd);
  const w = WINDOWS.find((win) => win.test(m, d));
  if (w) return { title: w.title, line: w.lines[h % w.lines.length] };
  const lines = GENERIC.map((f) => f(ctx)).filter((x): x is string => !!x);
  return { title: "The real reason", line: lines[h % lines.length] };
}
