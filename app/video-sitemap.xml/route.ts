import { videoPages, videoSitemapXml } from "@/lib/videoSitemap";

/** Built at deploy time from data/videos.json; an empty <urlset> until the video matcher has saved some. */
export const dynamic = "force-static";

export function GET() {
  return new Response(videoSitemapXml(videoPages()), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
