import type { Match } from "@/lib/goals";
import { youtubeSearchUrl } from "@/lib/share";
import { VideoFacade } from "./VideoFacade";

const TYPE_LABEL: Record<string, string> = {
  penalty: "Penalty",
  "free-kick": "Free kick",
  header: "Header",
  "open-play": "Open play",
};

function teamLine(m: Match) {
  // Home team first when known.
  if (m.venue === "A") return `${m.opponent} vs ${m.team}`;
  return `${m.team} vs ${m.opponent}`;
}

export function MatchCard({ m, mmdd }: { m: Match; mmdd: string }) {
  const n = m.goals.length;
  const videoLabel = `Play: Ronaldo goal${n > 1 ? "s" : ""} vs ${m.opponent}, ${m.year}`;
  return (
    <article className="rounded-3xl border border-border bg-surface p-4 sm:p-5" aria-labelledby={`h-${m.matchId}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-5xl font-black leading-none tracking-tighter text-gold">{m.year}</p>
          <h2 id={`h-${m.matchId}`} className="mt-2 text-lg font-black leading-tight">
            {teamLine(m)}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {m.competition}
            {m.stage ? ` · ${m.stage}` : ""}
            {m.result ? ` · Final score ${m.result}` : ""}
          </p>
        </div>
        <p
          className="shrink-0 rounded-2xl bg-surface-2 px-3 py-2 text-center font-black leading-none"
          aria-label={`${n} goal${n > 1 ? "s" : ""}`}
        >
          <span className="block text-2xl">{n}</span>
          <span className="block text-[10px] uppercase tracking-wide text-muted">goal{n > 1 ? "s" : ""}</span>
        </p>
      </div>

      <ul className="mt-3 flex flex-wrap gap-2" aria-label="Goals in this match">
        {m.goals.map((g) => (
          <li key={g.id} className="rounded-full bg-surface-2 px-3 py-1.5 text-sm font-bold">
            {g.minute ? `${g.minute}'` : "⚽"}
            {g.type ? ` · ${TYPE_LABEL[g.type]}` : ""}
            <span className="font-normal text-muted"> · career goal #{g.n}</span>
          </li>
        ))}
      </ul>
      {m.goals.some((g) => g.notes) && <p className="mt-2 text-xs text-muted">{m.goals.find((g) => g.notes)!.notes}</p>}

      <div className="mt-4">
        {m.video ? (
          <VideoFacade
            youtubeId={m.video.youtubeId}
            startSeconds={m.video.startSeconds}
            label={videoLabel}
            mmdd={mmdd}
            matchId={m.matchId}
          />
        ) : (
          <a
            href={youtubeSearchUrl(m)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 font-bold"
          >
            <span aria-hidden="true" className="text-red">
              ▶
            </span>{" "}
            Watch on YouTube
          </a>
        )}
      </div>
    </article>
  );
}
