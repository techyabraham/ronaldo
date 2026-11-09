export function shareText(count: number) {
  if (count > 0) return `Ronaldo scored ${count} goal${count === 1 ? "" : "s"} on my birthday 🐐 Check yours:`;
  return "Ronaldo never scored on my birthday 😅 Did he score on yours? Check:";
}

export function shareLinks(text: string, url: string) {
  const t = encodeURIComponent(text);
  const u = encodeURIComponent(url);
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    x: `https://x.com/intent/post?text=${t}&url=${u}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
  };
}

/** Prefilled YouTube search used when a match has no saved video. */
export function youtubeSearchUrl(q: { opponent: string; team: string; year: number; competition?: string }) {
  const query = `Cristiano Ronaldo goal ${q.team === "Portugal" ? "Portugal" : q.team} vs ${q.opponent} ${q.year}`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
