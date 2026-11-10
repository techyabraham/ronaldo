"use client";
import { useEffect } from "react";
import { writeLast } from "@/lib/storage";
import type { SharePayload } from "@/lib/share";
import { useShare } from "@/lib/useShare";
import { StoryIcon, WhatsAppIcon } from "./icons";

/** Sticky, thumb-reachable share CTA on every result page. */
export function ShareBar({
  mmdd,
  url,
  payload,
  label = "Post my GOAT Day",
  imagePath,
}: {
  mmdd: string;
  url: string;
  payload: SharePayload;
  label?: string;
  imagePath: string;
}) {
  const s = useShare({ mmdd, payload, placement: "sticky", imagePath });

  // Remember this date for the "check again" link on the home page.
  useEffect(() => writeLast(mmdd), [mmdd]);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-bg pb-[env(safe-area-inset-bottom)]"
      role="region"
      aria-label="Share your result"
    >
      <p className="sr-only" data-testid="share-text">
        {s.plain}
      </p>
      <div className="mx-auto flex max-w-md gap-2 px-4 pt-3 pb-3">
        <button
          type="button"
          onClick={s.post}
          className="inline-flex h-14 flex-1 items-center justify-center gap-2.5 rounded-xl bg-red font-display text-[22px] uppercase tracking-[0.03em] text-white active:translate-y-0.5"
        >
          <StoryIcon className="h-6 w-6" />
          {label}
        </button>
        <a
          href={s.links.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => s.log("whatsapp")}
          className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-green text-green-ink"
        >
          <WhatsAppIcon className="h-6 w-6" />
          <span className="sr-only">Share on WhatsApp</span>
        </a>
      </div>
      {s.toast && (
        <p role="status" className="pb-2 text-center text-sm font-bold text-green-text">
          {s.toast}
        </p>
      )}
    </div>
  );
}
