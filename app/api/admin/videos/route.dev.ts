import fs from "node:fs";
import path from "node:path";
import { VideosSchema, type MatchVideo } from "@/lib/schema";

/** Dev-only: writes review decisions back to data/videos.json. Not routed in production builds. */
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") return new Response("Not found", { status: 404 });
  const { matchId, action, youtubeId, startSeconds } = (await req.json()) as {
    matchId: string;
    action: "verify" | "reject" | "set";
    youtubeId?: string;
    startSeconds?: number;
  };
  const file = path.join(process.cwd(), "data", "videos.json");
  const videos = VideosSchema.parse(JSON.parse(fs.readFileSync(file, "utf8")));
  const now = new Date().toISOString();
  const cur: MatchVideo = videos[matchId] ?? { matchId, youtubeId: null, status: "missing" };
  if (action === "verify" && cur.youtubeId) videos[matchId] = { ...cur, status: "verified", checkedAt: now };
  else if (action === "reject") videos[matchId] = { matchId, youtubeId: null, status: "rejected", checkedAt: now };
  else if (action === "set" && youtubeId && /^[A-Za-z0-9_-]{11}$/.test(youtubeId))
    videos[matchId] = {
      matchId,
      youtubeId,
      status: "verified",
      checkedAt: now,
      ...(startSeconds ? { startSeconds } : {}),
    };
  else return Response.json({ error: "bad request" }, { status: 400 });
  fs.writeFileSync(file, JSON.stringify(VideosSchema.parse(videos), null, 2) + "\n");
  return Response.json(videos[matchId]);
}
