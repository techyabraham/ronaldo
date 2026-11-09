"use client";
import { useState } from "react";
import type { MatchVideo } from "@/lib/schema";

export type ReviewItem = {
  matchId: string;
  date: string;
  title: string;
  competition: string;
  goals: string[];
  video: MatchVideo | null;
};

/** Dev-only review UI; imported only by page.dev.tsx, so it never ships in production. */
export function ReviewList({ items }: { items: ReviewItem[] }) {
  const [state, setState] = useState<Record<string, string>>({});
  const send = async (matchId: string, body: Record<string, unknown>) => {
    const res = await fetch("/api/admin/videos", { method: "POST", body: JSON.stringify({ matchId, ...body }) });
    const j = await res.json();
    setState((s) => ({ ...s, [matchId]: res.ok ? j.status : `error: ${j.error}` }));
  };
  if (!items.length) return <p className="mt-6 text-muted">Nothing here.</p>;
  return (
    <ul className="mt-6 space-y-6">
      {items.map((m) => (
        <li key={m.matchId} className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-black">
              {m.date} · {m.title}
            </p>
            <p className="text-sm text-muted">
              {m.competition} · goals {m.goals.join(", ")}
            </p>
          </div>
          {m.video?.youtubeId ? (
            <>
              <div className="mt-3 aspect-video">
                <iframe
                  className="h-full w-full rounded-xl"
                  src={`https://www.youtube-nocookie.com/embed/${m.video.youtubeId}`}
                  title={m.video.title ?? m.matchId}
                  loading="lazy"
                  allowFullScreen
                />
              </div>
              <p className="mt-2 text-sm">
                {m.video.title}{" "}
                <span className="text-muted">
                  · {m.video.channel} · confidence {m.video.confidence ?? "?"}
                </span>
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">No video saved.</p>
          )}
          <form
            className="mt-3 flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              send(m.matchId, {
                action: "set",
                youtubeId: f.get("id"),
                startSeconds: Number(f.get("start")) || undefined,
              });
            }}
          >
            {m.video?.youtubeId && (
              <>
                <button
                  type="button"
                  className="min-h-11 rounded-xl bg-green px-4 font-bold text-black"
                  onClick={() => send(m.matchId, { action: "verify" })}
                >
                  ✅ Verify
                </button>
                <button
                  type="button"
                  className="min-h-11 rounded-xl bg-red px-4 font-bold text-white"
                  onClick={() => send(m.matchId, { action: "reject" })}
                >
                  ❌ Reject
                </button>
              </>
            )}
            <input
              name="id"
              aria-label="YouTube video id"
              placeholder="YouTube id (11 chars)"
              className="min-h-11 rounded-xl border border-border bg-surface-2 px-3"
            />
            <input
              name="start"
              aria-label="Start at second"
              placeholder="start s"
              inputMode="numeric"
              className="min-h-11 w-24 rounded-xl border border-border bg-surface-2 px-3"
            />
            <button className="min-h-11 rounded-xl border border-border px-4 font-bold">Set</button>
            {state[m.matchId] && <span className="text-sm text-gold">→ {state[m.matchId]}</span>}
          </form>
        </li>
      ))}
    </ul>
  );
}
