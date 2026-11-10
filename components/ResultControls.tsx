"use client";
import { useEffect, useState } from "react";
import type { SharePayload } from "@/lib/share";
import { useShare } from "@/lib/useShare";
import { openShareSheet } from "@/lib/shareSheet";
import { FacebookIcon, PlayIcon, ShareIcon, StoryIcon, WhatsAppIcon, XIcon } from "./icons";

/**
 * "Watch the goals": scrolls to the episodes and starts the first one with a saved video;
 * with no saved videos it opens a YouTube search for the day's most famous match.
 */
export function WatchGoals({
  videoMatchId,
  fallbackHref,
  variant,
}: {
  videoMatchId?: string;
  fallbackHref: string;
  variant: "hero" | "primary";
}) {
  const cls =
    variant === "hero"
      ? "flex h-[76px] w-[76px] items-center justify-center rounded-full bg-red text-white shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
      : "inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-white font-extrabold text-bg";
  const inner =
    variant === "hero" ? (
      <>
        <PlayIcon className="ml-1 h-8 w-8" />
        <span className="sr-only">Watch the goals</span>
      </>
    ) : (
      <>
        <PlayIcon /> Watch the goals
      </>
    );
  if (!videoMatchId) {
    return (
      <a href={fallbackHref} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={cls}
      onClick={() => {
        document.getElementById("episodes")?.scrollIntoView({ behavior: "smooth", block: "start" });
        document.querySelector<HTMLButtonElement>(`[data-play="${videoMatchId}"]`)?.click();
      }}
    >
      {inner}
    </button>
  );
}

const round = "flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface-2 text-text";

/**
 * One-tap sharing on the first screen: WhatsApp, X, Facebook, Story, and More (opens the share sheet).
 * Placement "quick". Used on both result layouts.
 */
export function QuickShare({ mmdd, payload, imagePath }: { mmdd: string; payload: SharePayload; imagePath: string }) {
  const s = useShare({ mmdd, payload, placement: "quick", imagePath });
  return (
    <div>
      <p className="text-[13px] font-bold text-muted">Share your result</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <a
          href={s.links.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on WhatsApp"
          onClick={() => s.log("whatsapp")}
          className={`${round} border-green bg-green text-green-ink`}
        >
          <WhatsAppIcon className="h-6 w-6" />
        </a>
        <a
          href={s.links.x}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on X"
          onClick={() => s.log("x")}
          className={round}
        >
          <XIcon />
        </a>
        <a
          href={s.links.facebook}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Facebook"
          onClick={() => s.log("facebook")}
          className={round}
        >
          <FacebookIcon />
        </a>
        <button type="button" onClick={s.image} aria-label="Post to Status or Story" className={round}>
          <StoryIcon />
        </button>
        <button
          type="button"
          aria-label="More ways to share"
          className={round}
          onClick={() => openShareSheet({ mmdd, payload, placement: "quick", imagePath })}
        >
          <ShareIcon className="h-5 w-5" />
        </button>
      </div>
      {s.toast && (
        <p role="status" className="pt-2 text-center text-sm font-bold text-green-text">
          {s.toast}
        </p>
      )}
    </div>
  );
}

const TABS = [
  { id: "episodes", label: "Goals" },
  { id: "calendar", label: "Calendar" },
  { id: "verdict", label: "Verdict" },
];

/**
 * In-page section links styled as tabs. Everything stays on the page (SEO, no-JS); JS only moves the
 * red underline to whichever section is on screen.
 */
export function SectionTabs() {
  const [active, setActive] = useState("episodes");
  useEffect(() => {
    const els = TABS.map((t) => document.getElementById(t.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-30% 0px -55% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  return (
    <nav aria-label="Sections" className="sticky top-0 z-30 -mx-4 bg-bg px-4">
      <ul className="flex gap-6 border-b border-hairline">
        {TABS.map((t) => (
          <li key={t.id}>
            <a
              href={`#${t.id}`}
              aria-current={active === t.id ? "location" : undefined}
              className={`-mb-px inline-flex min-h-11 items-center border-b-[3px] text-[15px] ${
                active === t.id ? "border-red font-extrabold text-text" : "border-transparent font-bold text-faint"
              }`}
            >
              {t.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
