"use client";
import { track as vercelTrack } from "@vercel/analytics";

export type ShareChannel =
  "native" | "image" | "save-image" | "whatsapp" | "x" | "facebook" | "telegram" | "threads" | "copy" | "invite";

/** Where on the page a share button lives. */
export type SharePlacement = "quick" | "sticky" | "episode" | "panel" | "sheet" | "home" | "tabbar";

type Event =
  | { name: "date_searched"; mmdd: string }
  | { name: "share_tapped"; mmdd: string; channel: ShareChannel; placement: SharePlacement }
  | { name: "share_sheet_opened"; mmdd: string; placement: SharePlacement }
  | { name: "video_played"; mmdd: string; matchId: string };

/** The only four events we collect. No personal data, no cookies. */
export function track(e: Event) {
  try {
    const { name, ...props } = e;
    vercelTrack(name, props);
  } catch {
    /* analytics must never break the page */
  }
}
