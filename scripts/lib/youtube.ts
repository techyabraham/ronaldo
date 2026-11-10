import fs from "node:fs";
import path from "node:path";
import { CACHE, DATA, ROOT, readJson } from "./util";
import { pickFamous } from "../../lib/famous";
import type { Goal } from "../../lib/schema";

export type SearchItem = {
  id: { videoId: string };
  snippet: { title: string; channelId: string; channelTitle: string; publishedAt: string; description?: string };
};

export type MatchInfo = Pick<Goal, "matchId" | "date" | "team" | "opponent" | "competition" | "stage"> & {
  goals: number;
};

const trusted = readJson<{ ids: string[]; names: string[] }>(path.join(DATA, "trusted-channels.json"));
const trustedNames = new Set(trusted.names.map((n) => n.toLowerCase()));
const trustedIds = new Set(trusted.ids);

const PENALISE = [
  "compilation",
  "top 10",
  "top10",
  "all goals",
  "every goal",
  "edit",
  "skills",
  "reaction",
  "reacts",
  "vs messi",
  "fifa 2",
  "efootball",
  "pes 20",
  "ea fc",
  "tribute",
  "career",
];

export function loadEnv() {
  for (const f of [".env.local", ".env"]) {
    const p = path.join(ROOT, f);
    if (fs.existsSync(p)) {
      try {
        process.loadEnvFile(p);
      } catch {
        /* ignore */
      }
    }
  }
}

function norm(s: string) {
  return s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Distinctive opponent tokens: "Atletico Madrid" -> ["atletico"], "Al-Kholood" -> ["kholood"]. */
export function opponentTokens(opponent: string) {
  const stop = new Set(["al", "fc", "cf", "sc", "club", "de", "real", "united", "city", "the", "madrid", "sporting"]);
  const toks = norm(opponent)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !stop.has(t));
  return toks.length ? toks : [norm(opponent)];
}

export function buildQuery(m: MatchInfo) {
  const year = m.date.slice(0, 4);
  const big = m.stage === "Final" ? ` ${m.competition} final` : "";
  return `Cristiano Ronaldo goal ${m.opponent} ${m.team} ${year}${big}`;
}

export function scoreCandidate(item: SearchItem, m: MatchInfo) {
  const title = norm(item.snippet.title);
  const reasons: string[] = [];
  let score = 0;
  if (/ronaldo|cr7|cristiano/.test(title)) {
    score += 3;
    reasons.push("+3 ronaldo");
  }
  const opp = opponentTokens(m.opponent);
  if (opp.some((t) => title.includes(t))) {
    score += 3;
    reasons.push("+3 opponent");
  }
  if (trustedIds.has(item.snippet.channelId) || trustedNames.has(item.snippet.channelTitle.toLowerCase())) {
    score += 3;
    reasons.push("+3 official channel");
  }
  const days = Math.abs(Date.parse(item.snippet.publishedAt) - Date.parse(m.date)) / 86_400_000;
  if (days <= 7) {
    score += 2;
    reasons.push("+2 published within a week");
  } else if (days <= 60) {
    score += 1;
    reasons.push("+1 published within 2 months");
  }
  if (title.includes(m.date.slice(0, 4))) {
    score += 1;
    reasons.push("+1 year in title");
  }
  if (/highlight|goal|golo|gol\b/.test(title)) {
    score += 1;
    reasons.push("+1 goal/highlights");
  }
  for (const w of PENALISE)
    if (title.includes(w)) {
      score -= 4;
      reasons.push(`-4 "${w}"`);
    }
  return { score, reasons };
}

/** Accept only candidates that name Ronaldo and the opponent and clear the threshold. */
export const ACCEPT_SCORE = 7;
export const MAX_SCORE = 13;

export function pickBest(items: SearchItem[], m: MatchInfo) {
  const ranked = items.map((it) => ({ it, ...scoreCandidate(it, m) })).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best) return null;
  const ok =
    best.score >= ACCEPT_SCORE &&
    best.reasons.some((r) => r.includes("ronaldo")) &&
    best.reasons.some((r) => r.includes("opponent"));
  return { ...best, ok, confidence: Math.max(0, Math.min(1, best.score / MAX_SCORE)) };
}

export const YT_CACHE = path.join(CACHE, "youtube");

export async function ytGet<T>(
  endpoint: "search" | "videos",
  params: Record<string, string>,
  cacheName?: string,
): Promise<T> {
  if (cacheName) {
    const f = path.join(YT_CACHE, cacheName);
    if (fs.existsSync(f)) return readJson<T>(f);
  }
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is not set (add it to .env.local; see .env.example)");
  const url = `https://www.googleapis.com/youtube/v3/${endpoint}?${new URLSearchParams({ ...params, key })}`;
  const res = await fetch(url);
  const body = await res.text();
  if (!res.ok) {
    const quota = /quota/i.test(body);
    throw Object.assign(
      new Error(`YouTube ${endpoint} ${res.status}${quota ? " (quota exceeded)" : ""}: ${body.slice(0, 300)}`),
      { quota },
    );
  }
  if (cacheName) {
    fs.mkdirSync(YT_CACHE, { recursive: true });
    fs.writeFileSync(path.join(YT_CACHE, cacheName), body);
  }
  return JSON.parse(body) as T;
}

export type VideoStatusItem = {
  id: string;
  status: { privacyStatus: string; embeddable: boolean; uploadStatus: string };
  snippet: { title: string; channelTitle: string; channelId: string };
};

/** videos.list in batches of 50 (1 unit each). */
export async function videoStatuses(ids: string[]) {
  const out = new Map<string, VideoStatusItem>();
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const res = await ytGet<{ items: VideoStatusItem[] }>("videos", {
      part: "status,snippet",
      id: batch.join(","),
      maxResults: "50",
    });
    for (const it of res.items ?? []) out.set(it.id, it);
  }
  return out;
}

export function matchesFromGoals(goals: Goal[]): MatchInfo[] {
  const map = new Map<string, MatchInfo>();
  for (const g of goals) {
    const m = map.get(g.matchId);
    if (m) m.goals++;
    else
      map.set(g.matchId, {
        matchId: g.matchId,
        date: g.date,
        team: g.team,
        opponent: g.opponent,
        competition: g.competition,
        stage: g.stage,
        goals: 1,
      });
  }
  return [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Search order: first the headline match of every scoring date (pickFamous per MM-DD), dates with the most
 * goals first, so every date gets a playable top match soonest; then everything else, newest first.
 */
export function featuredQueue(goals: Goal[]): { featured: MatchInfo[]; rest: MatchInfo[] } {
  const matches = matchesFromGoals(goals);
  const byDay = new Map<string, MatchInfo[]>();
  for (const m of matches) {
    const k = m.date.slice(5);
    byDay.set(k, [...(byDay.get(k) ?? []), m]);
  }
  const days = [...byDay.entries()].map(([mmdd, ms]) => ({
    mmdd,
    top: pickFamous(ms),
    goals: ms.reduce((a, m) => a + m.goals, 0),
  }));
  days.sort((a, b) => b.goals - a.goals || a.mmdd.localeCompare(b.mmdd));
  const featured = days.map((d) => d.top);
  const ids = new Set(featured.map((m) => m.matchId));
  const rest = matches.filter((m) => !ids.has(m.matchId)); // already newest first
  return { featured, rest };
}
