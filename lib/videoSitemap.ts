import "server-only";
import { ALL_MMDD } from "./dates";
import { matchesForDate } from "./goals";
import { videoMeta, type VideoMeta } from "./jsonld";
import { SITE_URL } from "./site";

export type VideoPage = { pageUrl: string; videos: VideoMeta[] };

/** Date pages that have at least one saved (verified/auto) video, in calendar order. */
export function videoPages(siteUrl = SITE_URL): VideoPage[] {
  return ALL_MMDD.map((mmdd) => ({
    pageUrl: `${siteUrl}/birthday/${mmdd}`,
    videos: matchesForDate(mmdd)
      .map(videoMeta)
      .filter((v): v is VideoMeta => !!v),
  })).filter((p) => p.videos.length > 0);
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/**
 * Google video sitemap (https://developers.google.com/search/docs/crawling-indexing/sitemaps/video-sitemaps).
 * One <url> per date page with videos, one <video:video> per saved video. An empty <urlset> is valid.
 */
export function videoSitemapXml(pages: VideoPage[]): string {
  const urls = pages.map((p) => {
    const vids = p.videos.map((v) =>
      [
        "    <video:video>",
        `      <video:thumbnail_loc>${esc(v.thumbnailUrl)}</video:thumbnail_loc>`,
        `      <video:title>${esc(v.title)}</video:title>`,
        `      <video:description>${esc(v.description)}</video:description>`,
        `      <video:player_loc>${esc(v.embedUrl)}</video:player_loc>`,
        // Only a real YouTube publish time; the match-date fallback would be a guess.
        ...(v.realUploadDate ? [`      <video:publication_date>${esc(v.uploadDate)}</video:publication_date>`] : []),
        "    </video:video>",
      ].join("\n"),
    );
    return ["  <url>", `    <loc>${esc(p.pageUrl)}</loc>`, ...vids, "  </url>"].join("\n");
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}
