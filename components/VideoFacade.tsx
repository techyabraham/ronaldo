"use client";
import type { ReactNode } from "react";
import { playerDomId, setActivePlayer, useActivePlayer } from "@/lib/activePlayer";
import { track } from "@/lib/analytics";
import { PlayIcon } from "./icons";

/**
 * An episode row with a real video: thumbnail + red play button, and the youtube-nocookie iframe only after
 * a tap (then full-width above the episode details). Only one video plays per page: starting one makes it
 * the active player, which returns any other to its thumbnail. `data-play` lets "Watch" buttons start it.
 */
export function VideoEpisode({
  youtubeId,
  startSeconds,
  label,
  badge,
  mmdd,
  matchId,
  opponent,
  year,
  eager = false,
  children,
}: {
  youtubeId: string;
  startSeconds?: number;
  label: string;
  badge: string;
  mmdd: string;
  matchId: string;
  opponent: string;
  year: number;
  /** First episode on the page: load its thumbnail eagerly. */
  eager?: boolean;
  children: ReactNode;
}) {
  const playing = useActivePlayer() === matchId;

  if (playing) {
    const params = new URLSearchParams({ autoplay: "1", rel: "0", playsinline: "1", modestbranding: "1" });
    if (startSeconds) params.set("start", String(startSeconds));
    const watchUrl = `https://www.youtube.com/watch?v=${youtubeId}${startSeconds ? `&t=${startSeconds}s` : ""}`;
    return (
      <div className="flex flex-col gap-2">
        <div id={playerDomId(matchId)} className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?${params}`}
            title={`Cristiano Ronaldo vs ${opponent}, ${year}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
        <div className="flex items-center justify-between">
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center text-[13px] font-bold text-muted"
          >
            Open on YouTube ↗
          </a>
          <button
            type="button"
            onClick={() => setActivePlayer(null)}
            className="inline-flex min-h-11 items-center px-2 text-[13px] font-bold text-muted"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <button
        type="button"
        data-play={matchId}
        onClick={() => {
          track({ name: "video_played", mmdd, matchId });
          setActivePlayer(matchId);
        }}
        aria-label={label}
        className="relative h-[86px] w-[150px] flex-none overflow-hidden rounded-[10px] bg-black"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`}
          alt=""
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          decoding="async"
          width={320}
          height={180}
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />
        <span className="absolute inset-0 m-auto flex h-10 w-10 items-center justify-center rounded-full bg-red text-white">
          <PlayIcon className="h-4 w-4" />
        </span>
        <span className="absolute right-1.5 bottom-1.5 rounded bg-bg px-1.5 py-0.5 text-[11px] font-extrabold">
          {badge}
        </span>
      </button>
      {children}
    </div>
  );
}
