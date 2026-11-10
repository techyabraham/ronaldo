"use client";
import { useEffect, useState } from "react";
import { playerDomId, useActivePlayer } from "@/lib/activePlayer";
import type { SharePayload } from "@/lib/share";
import { openShareSheet } from "@/lib/shareSheet";
import { writeLast } from "@/lib/storage";
import { useShare } from "@/lib/useShare";
import { PlayIcon, ShareIcon, WhatsAppIcon } from "./icons";

export type WatchTarget = {
  /** Match with a saved video on this page: scroll to it and play it inline. */
  videoMatchId?: string;
  /** Otherwise: YouTube search for the relevant match, in a new tab. */
  href: string;
};

/**
 * Sticky, thumb-reachable bar on every result page: Watch, Share (opens the share sheet), WhatsApp.
 * Slides out of the way while an inline video is playing and mostly on screen.
 */
export function ShareBar({
  mmdd,
  payload,
  imagePath,
  watch,
}: {
  mmdd: string;
  payload: SharePayload;
  imagePath: string;
  watch: WatchTarget;
}) {
  const s = useShare({ mmdd, payload, placement: "sticky", imagePath });
  const active = useActivePlayer();
  const [playerOnScreen, setPlayerOnScreen] = useState(false);
  const hidden = !!active && playerOnScreen;

  // Remember this date for the "check again" link on the home page.
  useEffect(() => writeLast(mmdd), [mmdd]);

  useEffect(() => {
    const el = active ? document.getElementById(playerDomId(active)) : null;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setPlayerOnScreen(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [active]);

  const watchCls =
    "inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-4 font-display text-xl uppercase tracking-[0.03em] text-text";
  const watchInner = (
    <>
      <PlayIcon /> Watch
    </>
  );

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-bg pb-[env(safe-area-inset-bottom)] transition-transform duration-200 motion-reduce:transition-none ${hidden ? "translate-y-full" : ""}`}
      role="region"
      aria-label="Watch and share"
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
    >
      <p className="sr-only" data-testid="share-text">
        {s.plain}
      </p>
      <div className="mx-auto flex max-w-md gap-2 px-4 py-3">
        {watch.videoMatchId ? (
          <button
            type="button"
            className={watchCls}
            onClick={() => {
              document.getElementById("episodes")?.scrollIntoView({ behavior: "smooth", block: "start" });
              document.querySelector<HTMLButtonElement>(`[data-play="${watch.videoMatchId}"]`)?.click();
            }}
          >
            {watchInner}
          </button>
        ) : (
          <a href={watch.href} target="_blank" rel="noopener noreferrer" className={watchCls}>
            {watchInner}
          </a>
        )}
        <button
          type="button"
          onClick={() => openShareSheet({ mmdd, payload, placement: "sticky", imagePath })}
          className="inline-flex h-14 flex-1 items-center justify-center gap-2.5 rounded-xl bg-red font-display text-[22px] uppercase tracking-[0.03em] text-white active:translate-y-0.5"
        >
          <ShareIcon className="h-5 w-5" />
          Share
        </button>
        <a
          href={s.links.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => s.log("whatsapp")}
          className="inline-flex h-14 w-14 flex-none items-center justify-center rounded-xl bg-green text-green-ink"
        >
          <WhatsAppIcon className="h-6 w-6" />
          <span className="sr-only">Share on WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
