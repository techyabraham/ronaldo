/**
 * Find a YouTube video for each match (not each goal). Order: the headline match of every scoring date
 * first (dates with the most goals first), so every date gets a playable top match soonest; then the rest,
 * newest first.
 *
 *   npm run data:videos                          # next 90 matches without a video (~ the daily quota)
 *   npm run data:videos -- --limit 20            # just 20
 *   npm run data:videos -- --featured-only       # only each date's headline match
 *   npm run data:videos -- --dry-run             # print the queries, spend nothing
 *
 * Quota: search.list is ~100 searches/day on the default 10,000-unit allocation; videos.list costs 1 unit
 * per 50 ids. Every response is cached in data/raw/cache/youtube, and data/videos.json is saved after
 * every match, so the script can be stopped and resumed safely. Quota resets at midnight Pacific Time.
 */
import path from "node:path";
import { DATA, hasFlag, log, readJson, writeJson } from "./lib/util";
import { buildQuery, featuredQueue, loadEnv, pickBest, videoStatuses, ytGet, type SearchItem } from "./lib/youtube";
import { VideosSchema, type Goal, type MatchVideo, type Videos } from "../lib/schema";

const VIDEOS = path.join(DATA, "videos.json");

function arg(name: string, fallback: number) {
  const i = process.argv.indexOf(name);
  return i > 0 ? parseInt(process.argv[i + 1], 10) : fallback;
}

async function main() {
  loadEnv();
  const dry = hasFlag("--dry-run");
  const limit = arg("--limit", 90);
  const goals = readJson<Goal[]>(path.join(DATA, "goals.json"));
  const videos: Videos = VideosSchema.parse(readJson(VIDEOS));
  const save = () =>
    writeJson(VIDEOS, Object.fromEntries(Object.entries(videos).sort(([a], [b]) => b.localeCompare(a))));

  const queue = featuredQueue(goals);
  const ordered = hasFlag("--featured-only") ? queue.featured : [...queue.featured, ...queue.rest];
  const todo = ordered.filter((m) => {
    const v = videos[m.matchId];
    // Skip anything already matched, verified or rejected by a human. Retry "missing" once a week at most.
    if (!v) return true;
    if (v.status !== "missing") return false;
    return !v.checkedAt || Date.now() - Date.parse(v.checkedAt) > 7 * 86_400_000;
  });
  log(
    "videos",
    `${todo.length} ${hasFlag("--featured-only") ? "featured " : ""}matches need a video; processing ${Math.min(limit, todo.length)}${dry ? " (dry run)" : ""}`,
  );

  const report: { matchId: string; query: string; pick: string; confidence: number; ok: boolean }[] = [];
  const winners: string[] = [];
  for (const m of todo.slice(0, limit)) {
    const q = buildQuery(m);
    if (dry) {
      console.log(`  ${m.matchId}  →  "${q}"`);
      continue;
    }
    let res: { items: SearchItem[] };
    try {
      res = await ytGet<{ items: SearchItem[] }>(
        "search",
        { part: "snippet", type: "video", videoEmbeddable: "true", relevanceLanguage: "en", maxResults: "5", q },
        `search-${m.matchId}.json`,
      );
    } catch (e) {
      if ((e as { quota?: boolean }).quota) {
        log("videos", "Daily quota reached; progress saved. Run again after midnight Pacific Time.");
        break;
      }
      throw e;
    }
    const best = pickBest(res.items ?? [], m);
    const now = new Date().toISOString();
    if (best?.ok) {
      const rec: MatchVideo = {
        matchId: m.matchId,
        youtubeId: best.it.id.videoId,
        title: best.it.snippet.title,
        channel: best.it.snippet.channelTitle,
        channelId: best.it.snippet.channelId,
        status: "auto",
        confidence: Number(best.confidence.toFixed(2)),
        checkedAt: now,
      };
      videos[m.matchId] = rec;
      winners.push(rec.youtubeId!);
    } else {
      videos[m.matchId] = { matchId: m.matchId, youtubeId: null, status: "missing", checkedAt: now };
    }
    report.push({
      matchId: m.matchId,
      query: q,
      pick: best
        ? `${best.it.snippet.title} [${best.it.snippet.channelTitle}] (${best.reasons.join(", ")})`
        : "no results",
      confidence: best ? Number(best.confidence.toFixed(2)) : 0,
      ok: !!best?.ok,
    });
    save();
  }

  // Confirm winners are public + embeddable (1 unit per 50 ids).
  if (winners.length) {
    const st = await videoStatuses(winners);
    for (const v of Object.values(videos)) {
      if (v.status !== "auto" || !v.youtubeId || !winners.includes(v.youtubeId)) continue;
      const s = st.get(v.youtubeId);
      if (!s || s.status.privacyStatus !== "public" || !s.status.embeddable) {
        log("videos", `${v.matchId}: ${v.youtubeId} not public/embeddable; marking missing`);
        videos[v.matchId] = {
          matchId: v.matchId,
          youtubeId: null,
          status: "missing",
          checkedAt: new Date().toISOString(),
        };
      }
    }
    save();
  }

  for (const r of report) console.log(`${r.ok ? "✓" : "✗"} ${r.confidence.toFixed(2)}  ${r.matchId}\n    ${r.pick}`);
  const stats = Object.values(videos).reduce<Record<string, number>>(
    (a, v) => ((a[v.status] = (a[v.status] ?? 0) + 1), a),
    {},
  );
  log("videos", "videos.json status counts:", stats);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
