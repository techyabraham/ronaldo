export type ShareMatch = { opponent: string; year: number; competition: string; stage?: string; goals: number };

function goalsPhrase(n: number) {
  if (n === 1) return "a goal";
  if (n === 2) return "a brace";
  if (n === 3) return "a hat-trick";
  return `${n} goals`;
}

/** "a hat-trick vs Atletico Madrid in the 2017 Champions League semi-final" */
export function highlightPhrase(m: ShareMatch) {
  const big = m.stage && /Final|Semi|Quarter|Round of/.test(m.stage);
  const where = big ? ` in the ${m.year} ${m.competition} ${m.stage!.toLowerCase()}` : ` in ${m.year}`;
  return `${goalsPhrase(m.goals)} vs ${m.opponent}${where}`;
}

/**
 * The message people actually post. Written to brag (yes) or to provoke curiosity (no),
 * always ending with a challenge so the friend clicks through and checks their own date.
 */
export function shareText(opts: {
  count: number;
  label: string;
  highlight?: ShareMatch | null;
  hisBirthday?: boolean;
}) {
  const { count, label, highlight, hisBirthday } = opts;
  const bday = hisBirthday ? "I share a birthday with Cristiano 🎂 " : "";
  if (count > 0) {
    const incl = highlight ? `, including ${highlightPhrase(highlight)}` : "";
    return `${bday}Ronaldo scored ${count} goal${count === 1 ? "" : "s"} on my birthday (${label})${incl} 🐐 Did he score on yours? 👇`;
  }
  return `${bday}Ronaldo has NEVER scored on my birthday (${label}) 😅 Did he score on yours? 👇`;
}

/** Short invite used on the home page (no result yet). */
export const INVITE_TEXT = "Did Ronaldo score on your birthday? 🐐 I just checked mine, find out yours 👇";

export function shareLinks(text: string, url: string) {
  const t = encodeURIComponent(text);
  const u = encodeURIComponent(url);
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    x: `https://x.com/intent/post?text=${t}&url=${u}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    telegram: `https://t.me/share/url?url=${u}&text=${t}`,
  };
}

/** Prefilled YouTube search used when a match has no saved video. */
export function youtubeSearchUrl(q: { opponent: string; team: string; year: number; competition?: string }) {
  const query = `Cristiano Ronaldo goal ${q.team === "Portugal" ? "Portugal" : q.team} vs ${q.opponent} ${q.year}`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
