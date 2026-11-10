"use client";
import { useSyncExternalStore } from "react";

/**
 * The one video playing on the page (by matchId). Starting a video makes it active, which returns any other
 * playing video to its thumbnail; the sticky share bar hides while the active player is on screen.
 */
let active: string | null = null;
const listeners = new Set<() => void>();

export function setActivePlayer(id: string | null) {
  if (active === id) return;
  active = id;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useActivePlayer() {
  return useSyncExternalStore(
    subscribe,
    () => active,
    () => null,
  );
}

/** DOM id of a playing video's wrapper, observed by the sticky bar. */
export const playerDomId = (matchId: string) => `player-${matchId}`;
