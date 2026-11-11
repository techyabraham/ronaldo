"use client";
import { track as vercelTrack } from "@vercel/analytics";
import type { PartnerPlacement } from "./partner";

export type ShareChannel =
  "native" | "image" | "save-image" | "whatsapp" | "x" | "facebook" | "telegram" | "threads" | "copy" | "invite";

/** Where on the page a share button lives. */
export type SharePlacement = "quick" | "sticky" | "episode" | "panel" | "sheet" | "home" | "tabbar";

type Event =
  | { name: "date_searched"; mmdd: string }
  | { name: "share_tapped"; mmdd: string; channel: ShareChannel; placement: SharePlacement }
  | { name: "share_sheet_opened"; mmdd: string; placement: SharePlacement }
  | { name: "video_played"; mmdd: string; matchId: string }
  | { name: "partner_click"; placement: PartnerPlacement };

/** The only five events we collect (four product events + sponsor-banner clicks). No personal data, no cookies. */
export function track(e: Event) {
  try {
    const { name, ...props } = e;
    vercelTrack(name, props);
  } catch {
    /* analytics must never break the page */
  }
}
