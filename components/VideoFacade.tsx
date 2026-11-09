"use client";
import { useState } from "react";
import { track } from "@/lib/analytics";

/**
 * Lightweight YouTube facade: a thumbnail and a play button. The real iframe
 * (youtube-nocookie) only loads after the user taps.
 */
export function VideoFacade({
  youtubeId,
  startSeconds,
  label,
  mmdd,
  matchId,
}: {
  youtubeId: string;
  startSeconds?: number;
  label: string;
  mmdd: string;
  matchId: string;
}) {
  const [playing, setPlaying] = useState(false);
  if (playing) {
    const params = new URLSearchParams({ autoplay: "1", rel: "0", playsinline: "1" });
    if (startSeconds) params.set("start", String(startSeconds));
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?${params}`}
          title={label}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        track({ name: "video_played", mmdd, matchId });
        setPlaying(true);
      }}
      aria-label={label}
      className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-black"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        decoding="async"
        width={480}
        height={360}
        className="absolute inset-0 h-full w-full object-cover opacity-85 group-hover:opacity-100"
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red text-white shadow-lg">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  );
}
