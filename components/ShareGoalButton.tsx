"use client";
import type { SharePayload } from "@/lib/share";
import { openShareSheet } from "@/lib/shareSheet";
import { ShareIcon } from "./icons";

/** "Share this goal" under a match card: opens the share sheet with that match's payload. */
export function ShareGoalButton({ mmdd, payload }: { mmdd: string; payload: SharePayload }) {
  return (
    <button
      type="button"
      onClick={() => openShareSheet({ mmdd, payload, placement: "episode" })}
      className="inline-flex min-h-11 w-fit items-center gap-1.5 text-[13px] font-extrabold text-red-text"
    >
      <ShareIcon className="h-4 w-4" />
      Share this goal
    </button>
  );
}
