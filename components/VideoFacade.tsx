"use client";
import { useState, type ReactNode } from "react";
import { track } from "@/lib/analytics";
import { PlayIcon } from "./icons";

/**
 * An episode row with a real video: thumbnail + red play button, and the youtube-nocookie iframe
 * only after a tap (then shown full-width above the episode details). `children` is the server-rendered
 * text column. `data-play` lets the "Watch the goals" buttons start the first episode.
 */
export function VideoEpisode({
  youtubeId,
  startSeconds,
  label,
  badge,
  mmdd,
  matchId,
  children,
}: {
  youtubeId: string;
  startSeconds?: number;
  label: string;
  badge: string;
  mmdd: string;
  matchId: string;
  children: ReactNode;
}) {
  const [playing, setPlaying] = useState(false);
  if (playing) {
    const params = new URLSearchParams({ autoplay: "1", rel: "0", playsinline: "1" });
    if (startSeconds) params.set("start", String(startSeconds));
    return (
      <div className="flex flex-col gap-3">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?${params}`}
            title={label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
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
          setPlaying(true);
        }}
        aria-label={label}
        className="relative h-[86px] w-[150px] flex-none overflow-hidden rounded-[10px] bg-black"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`}
          alt=""
          loading="lazy"
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
