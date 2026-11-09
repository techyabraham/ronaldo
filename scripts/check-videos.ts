/**
 * Weekly health check: run every saved video id through videos.list (50 ids per call, ~15 units total)
 * and flag anything removed, private or no longer embeddable. Flagged videos are set back to
 * status "missing" so the page shows the YouTube search fallback, never a broken embed.
 *
 *   npm run data:check-videos            # update data/videos.json
 *   npm run data:check-videos -- --report-only
 */
import path from "node:path";
import { DATA, hasFlag, log, readJson, writeJson } from "./lib/util";
import { loadEnv, videoStatuses } from "./lib/youtube";
import { VideosSchema } from "../lib/schema";

async function main() {
  loadEnv();
  const file = path.join(DATA, "videos.json");
  const videos = VideosSchema.parse(readJson(file));
  const live = Object.values(videos).filter((v) => v.youtubeId && (v.status === "auto" || v.status === "verified"));
  const ids = [
    ...new Set(
      live
        .map((v) => v.youtubeId!)
        .concat(live.flatMap((v) => Object.values(v.goalOverrides ?? {}).map((o) => o.youtubeId))),
    ),
  ];
  if (!ids.length) {
    log("check-videos", "no saved videos to check");
    return;
  }
  const st = await videoStatuses(ids);
  const broken: string[] = [];
  for (const v of live) {
    const s = st.get(v.youtubeId!);
    const ok = s && s.status.privacyStatus === "public" && s.status.embeddable && s.status.uploadStatus === "processed";
    if (!ok) {
      broken.push(
        `${v.matchId} (${v.youtubeId}, was ${v.status}): ${s ? `${s.status.privacyStatus}, embeddable=${s.status.embeddable}` : "removed"}`,
      );
      if (!hasFlag("--report-only"))
        videos[v.matchId] = {
          matchId: v.matchId,
          youtubeId: null,
          status: "missing",
          checkedAt: new Date().toISOString(),
        };
    }
  }
  if (!hasFlag("--report-only")) writeJson(file, videos);
  log("check-videos", `checked ${ids.length} ids in ${Math.ceil(ids.length / 50)} call(s); ${broken.length} broken`);
  for (const b of broken) console.log("  ✗ " + b);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
