"use client";
import { useSyncExternalStore } from "react";
import type { SharePlacement } from "./analytics";
import type { SharePayload } from "./share";

/** What the one ShareSheet on the page should show. `n` changes on every open, so reopening the same payload works. */
export type ShareSheetRequest = {
  n: number;
  mmdd: string;
  payload: SharePayload;
  placement: SharePlacement;
  /** Story PNG; only for date payloads. */
  imagePath?: string;
};

let current: ShareSheetRequest | null = null;
let seq = 0;
const listeners = new Set<() => void>();

/** Open the page's ShareSheet from anywhere, without prop drilling. */
export function openShareSheet(req: Omit<ShareSheetRequest, "n">) {
  current = { ...req, n: ++seq };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useShareSheetRequest() {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
}
