"use client";
import { useEffect, useState } from "react";
import type { SharePayload } from "@/lib/share";
import { useShare } from "@/lib/useShare";
import { LinkIcon, PlayIcon, ShareIcon, StoryIcon } from "./icons";

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
      : "inline-flex h-[54px] items-center justify-center gap-2 rounded-xl bg-white font-extrabold text-bg";
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

/** Watch + Copy link + Share, under the result title. */
export function ResultActions({
  mmdd,
  url,
  payload,
  videoMatchId,
  fallbackHref,
}: {
  mmdd: string;
  url: string;
  payload: SharePayload;
  videoMatchId?: string;
  fallbackHref: string;
}) {
  const s = useShare({ mmdd, payload, placement: "quick" });
  const icon = "flex h-[54px] items-center justify-center rounded-xl border border-border bg-surface text-text";
  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_56px_56px] gap-2">
        <WatchGoals videoMatchId={videoMatchId} fallbackHref={fallbackHref} variant="primary" />
        <button type="button" onClick={s.copy} className={icon} aria-label="Copy link">
          <LinkIcon />
        </button>
        <button
          type="button"
          className={icon}
          aria-label="Share"
          onClick={() => {
            if (s.canNative) return s.native();
            document.getElementById("share")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
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

/** Big red "Post my rare day" on no-goal pages: same action as the sticky bar. */
export function PostButton({
  mmdd,
  url,
  payload,
  imagePath,
  label,
}: {
  mmdd: string;
  url: string;
  payload: SharePayload;
  imagePath: string;
  label: string;
}) {
  const s = useShare({ mmdd, payload, placement: "panel", imagePath });
  return (
    <>
      <button
        type="button"
        onClick={s.post}
        className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-red font-display text-[22px] uppercase tracking-[0.03em] text-white"
      >
        <StoryIcon className="h-6 w-6" /> {label}
      </button>
      {s.toast && (
        <p role="status" className="pt-2 text-center text-sm font-bold text-green-text">
          {s.toast}
        </p>
      )}
    </>
  );
}

const TABS = [
  { id: "episodes", label: "Episodes" },
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
