"use client";
import { useEffect } from "react";
import { writeLast } from "@/lib/storage";
import { useShare } from "@/lib/useShare";
import { WhatsAppIcon, shareBtn } from "./shareStyles";

/** Sticky, thumb-reachable share CTA on every result page. */
export function ShareBar({ mmdd, url, text }: { mmdd: string; url: string; text: string }) {
  const s = useShare({ mmdd, url, text, placement: "sticky" });

  // Remember this date for the "check again" link on the home page.
  useEffect(() => writeLast(mmdd), [mmdd]);

  const main = () => {
    if (s.canNative) return s.native();
    // No OS share sheet (most desktops): jump to the full share panel instead.
    s.log("native");
    const panel = document.getElementById("share");
    panel?.scrollIntoView({ behavior: "smooth", block: "start" });
    panel?.querySelector<HTMLElement>("a,button")?.focus({ preventScroll: true });
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg pb-[env(safe-area-inset-bottom)]"
      role="region"
      aria-label="Share your result"
    >
      <p className="sr-only" data-testid="share-text">
        {text} {url}
      </p>
      <div className="mx-auto flex max-w-xl gap-2 px-3 py-2">
        <button type="button" onClick={main} className={`${shareBtn.primary} flex-1 text-lg uppercase tracking-tight`}>
          <span aria-hidden="true">📣</span> Share my result
        </button>
        <a
          href={s.links.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => s.log("whatsapp")}
          className={`${shareBtn.whatsapp} w-14 px-0`}
        >
          <WhatsAppIcon className="h-6 w-6" />
          <span className="sr-only">Share on WhatsApp</span>
        </a>
      </div>
      {s.toast && (
        <p role="status" className="pb-2 text-center text-sm font-bold text-red-text">
          {s.toast}
        </p>
      )}
    </div>
  );
}
