"use client";
import { track as vercelTrack } from "@vercel/analytics";

type Event =
  | { name: "date_searched"; mmdd: string }
  | { name: "share_tapped"; mmdd: string; channel: string }
  | { name: "video_played"; mmdd: string; matchId: string };

/** The only three events we collect. No personal data, no cookies. */
export function track(e: Event) {
  try {
    const { name, ...props } = e;
    vercelTrack(name, props);
  } catch {
    /* analytics must never break the page */
  }
}
