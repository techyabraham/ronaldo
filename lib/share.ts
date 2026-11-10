import { competitionLabel } from "./competition";
import { CREDIT_LINK, CREDIT_X } from "./site";

export type ShareMatch = { opponent: string; year: number; competition: string; stage?: string; goals: number };

/** "a goal", "a brace", "a hat-trick", "4 goals" */
export function goalsPhrase(n: number) {
  if (n === 1) return "a goal";
  if (n === 2) return "a brace";
  if (n === 3) return "a hat-trick";
  return `${n} goals`;
}

/** Same without the article, for possessives: "Ronaldo's hat-trick", "Ronaldo's 4 goals". */
function goalsNoun(n: number) {
  return goalsPhrase(n).replace(/^a /, "");
}

/** "a hat-trick vs Atletico Madrid in the 2017 Champions League semi-final" */
export function highlightPhrase(m: ShareMatch) {
  const big = m.stage && /Final|Semi|Quarter|Round of/.test(m.stage);
  const where = big ? ` in the ${m.year} ${m.competition} ${m.stage!.toLowerCase()}` : ` in ${m.year}`;
  return `${goalsPhrase(m.goals)} vs ${m.opponent}${where}`;
}

/** Shorter highlight used when an X post would go over the limit: "a hat-trick vs Atletico Madrid in 2017". */
function shortHighlight(m: ShareMatch) {
  return `${goalsPhrase(m.goals)} vs ${m.opponent} in ${m.year}`;
}

export type SharePayload =
  | {
      kind: "date";
      count: number;
      label: string;
      highlight?: ShareMatch | null;
      hisBirthday?: boolean;
      url: string;
    }
  | { kind: "goal"; match: ShareMatch & { team: string }; label: string; url: string } // url ends #m-{matchId}
  | { kind: "invite"; url: string };

export type BuiltShare = {
  /** Sentence(s) only: no URL, no credit. */
  message: string;
  /** `${message}\n${url}\n\n${CREDIT_LINK}`: copy, native share, WhatsApp, Threads, Story caption. */
  plain: string;
  links: { whatsapp: string; x: string; facebook: string; telegram: string; threads: string };
};

type HighlightMode = "full" | "short" | "none";

function messageFor(p: SharePayload, mode: HighlightMode = "full"): string {
  if (p.kind === "invite") return "Has Ronaldo scored on your birthday? 🐐 I just checked mine. Check yours 👇";
  if (p.kind === "goal") {
    const m = p.match;
    return `Watch Ronaldo's ${goalsNoun(m.goals)} vs ${m.opponent} (${m.year}). He did it on my birthday 🐐 Check yours 👇`;
  }
  const bday = p.hisBirthday ? "I share a birthday with Cristiano Ronaldo 🎂 " : "";
  if (p.count > 0) {
    const h = p.highlight;
    const incl = h && mode !== "none" ? `, including ${mode === "full" ? highlightPhrase(h) : shortHighlight(h)}` : "";
    return `${bday}Ronaldo scored ${p.count} goal${p.count === 1 ? "" : "s"} on my birthday (${p.label})${incl} 🐐 Has he scored on yours? 👇`;
  }
  return `${bday}Ronaldo has never scored on my birthday (${p.label}) 😅 Even the GOAT takes a day off. Has he scored on yours? 👇`;
}

/**
 * Length as X counts it (twitter-text v3 weighting): every URL is 23; code points in the listed
 * Latin/punctuation ranges are 1; everything else (CJK, emoji, …) is 2. The limit is 280.
 */
export function xWeightedLength(s: string): number {
  let n = 0;
  const text = s.replace(/https?:\/\/\S+/g, () => {
    n += 23;
    return "";
  });
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    const light =
      (cp >= 0x0000 && cp <= 0x10ff) ||
      (cp >= 0x2000 && cp <= 0x200d) ||
      (cp >= 0x2010 && cp <= 0x201f) ||
      (cp >= 0x2032 && cp <= 0x2037);
    n += light ? 1 : 2;
  }
  return n;
}

export const X_LIMIT = 280;

/**
 * The text of an X post: message, #Ronaldo, the site URL (so X builds the card), then the credit as the
 * last line. If it's too long: drop #Ronaldo, then shorten the highlight, then drop it. Never drop the credit.
 */
export function xText(p: SharePayload, limit = X_LIMIT): string {
  const attempts: [HighlightMode, boolean][] = [
    ["full", true],
    ["full", false],
    ["short", false],
    ["none", false],
  ];
  let text = "";
  for (const [mode, tag] of attempts) {
    text = `${messageFor(p, mode)}${tag ? " #Ronaldo" : ""}\n${p.url}\n\n${CREDIT_X}`;
    if (xWeightedLength(text) <= limit) return text;
  }
  return text;
}

/** One builder for every share surface, so all channels say the same thing and carry the credit. */
export function buildShare(p: SharePayload): BuiltShare {
  const message = messageFor(p);
  const plain = `${message}\n${p.url}\n\n${CREDIT_LINK}`;
  const u = encodeURIComponent(p.url);
  return {
    message,
    plain,
    links: {
      // Site URL first: WhatsApp and Telegram preview the first link, and that must be our OG card.
      whatsapp: `https://wa.me/?text=${encodeURIComponent(plain)}`,
      // URL inside the text, no url/via params, so the credit is the post's last line.
      x: `https://x.com/intent/post?text=${encodeURIComponent(xText(p))}`,
      // Facebook ignores prefilled text; the credit travels on the OG image instead.
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      telegram: `https://t.me/share/url?url=${u}&text=${encodeURIComponent(`${message}\n\n${CREDIT_LINK}`)}`,
      threads: `https://www.threads.net/intent/post?text=${encodeURIComponent(plain)}`,
    },
  };
}

/**
 * Prefilled YouTube search used when a match has no saved video, as precise as the data allows:
 * "Cristiano Ronaldo goals Portugal 2-2 France Euro 2020 2021". Team first (as in the data), plain hyphen
 * in the score (YouTube matches "2-2" better than an en dash), extra-time/penalty notes stripped.
 */
export function youtubeSearchUrl(q: {
  opponent: string;
  team: string;
  year: number;
  competition?: string;
  result?: string | null;
  /** Goal count, or the list of goals (as on Match). */
  goals?: number | readonly unknown[];
}) {
  const goalCount = typeof q.goals === "number" ? q.goals : (q.goals?.length ?? 1);
  const score = q.result
    ? q.result
        .replace(/\([^)]*\)/g, " ")
        .replace(/[–—]/g, "-")
        .trim()
    : "";
  const fixture = score ? `${q.team} ${score} ${q.opponent}` : `${q.team} vs ${q.opponent}`;
  // Drop the label's own year when it is the match year ("World Cup 2018" + 2018), but keep "Euro 2020" in 2021.
  const label = q.competition ? competitionLabel(q.competition, q.year) : "";
  const comp = label.endsWith(` ${q.year}`) ? label.slice(0, -` ${q.year}`.length) : label;
  const query = `Cristiano Ronaldo ${goalCount > 1 ? "goals" : "goal"} ${fixture} ${comp} ${q.year}`
    .replace(/\s+/g, " ")
    .trim();
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
