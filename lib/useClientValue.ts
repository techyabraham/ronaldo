"use client";
import { useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

/**
 * Read a browser-only value (localStorage, today's date, navigator features) without a hydration
 * mismatch: the server and the first client render use `serverValue`, then React switches to `get()`.
 * `get` must return a primitive (or a stable reference) so React can compare snapshots.
 */
export function useClientValue<T>(
  get: () => T,
  serverValue: T,
  subscribe: (cb: () => void) => () => void = noSubscribe,
): T {
  return useSyncExternalStore(subscribe, get, () => serverValue);
}
