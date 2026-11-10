import type { Match } from "@/lib/goals";
import { competitionLabel } from "@/lib/labels";
import type { MatchNote } from "@/lib/moments";
import { thumbPhotoFor } from "@/lib/photos";
import { youtubeSearchUrl } from "@/lib/share";
import { EpisodeTile } from "./EpisodeTile";
import { PlayIcon } from "./icons";
import { VideoEpisode } from "./VideoFacade";

const TYPE_LABEL: Record<string, string> = {
  penalty: "Penalty",
  "free-kick": "Free kick",
  header: "Header",
  "open-play": "Open play",
};

/** "3-0 (a.e.t.)" -> "3–0 (a.e.t.)" (en dash between the scores). */
function dash(result: string) {
  return result.replace(/(\d)-(\d)/g, "$1–$2");
}

function chipText(g: Match["goals"][number]) {
  const type = g.type ? TYPE_LABEL[g.type] : null;
  if (g.minute) return `${g.minute}′${type ? ` ${type}` : ""}`;
  if (type) return type;
  return `Goal #${g.n}`;
}

/** One match on a date, styled as a streaming "episode". Server component. */
export function MatchCard({ m, index, mmdd, note }: { m: Match; index: number; mmdd: string; note?: MatchNote }) {
  const n = m.goals.length;
  const badge = `${n} GOAL${n === 1 ? "" : "S"}`;
  const scoreline = m.result ? `${m.team} ${dash(m.result)} ${m.opponent}` : `${m.team} vs ${m.opponent}`;
  const comp = [competitionLabel(m.competition, m.year), m.stage].filter(Boolean).join(" · ");
  const disputed = m.goals.find((g) => g.notes)?.notes;

  const details = (
    <div className="flex min-w-0 flex-col gap-0.5">
      <p className="text-xs font-extrabold text-muted">
        E{index} · {m.year}
        {note?.record && <span className="text-red-text"> · RECORD</span>}
      </p>
      <h3 className="text-base font-extrabold leading-tight">{scoreline}</h3>
      <p className="text-xs text-muted">{comp}</p>
    </div>
  );

  return (
    <article className="flex flex-col gap-2.5" aria-labelledby={`ep-${m.matchId}`}>
      <span id={`ep-${m.matchId}`} className="sr-only">
        {scoreline}, {m.year}
      </span>
      {m.video ? (
        <VideoEpisode
          youtubeId={m.video.youtubeId}
          startSeconds={m.video.startSeconds}
          label={`Play: Ronaldo goal${n > 1 ? "s" : ""} vs ${m.opponent}, ${m.year}`}
          badge={badge}
          mmdd={mmdd}
          matchId={m.matchId}
        >
          {details}
        </VideoEpisode>
      ) : (
        <div className="flex gap-3">
          <a href={youtubeSearchUrl(m)} target="_blank" rel="noopener noreferrer" className="flex-none">
            <EpisodeTile
              tone={index % 2 ? "green" : "red"}
              badge={badge}
              badgePosition="bottom-right"
              photo={thumbPhotoFor(m.team)}
              photoSizes="150px"
              className="h-[86px] w-[150px] rounded-[10px]"
            >
              <span className="absolute inset-0 m-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/30">
                <PlayIcon className="h-4 w-4" />
              </span>
            </EpisodeTile>
            <span className="sr-only">
              Watch {m.team} vs {m.opponent}, {m.year} on YouTube ({n} goal{n === 1 ? "" : "s"})
            </span>
          </a>
          {details}
        </div>
      )}

      <ul className="flex flex-wrap gap-1.5" aria-label="Goals in this match">
        {m.goals.map((g) => (
          <li key={g.id} className="rounded-md bg-surface-2 px-2.5 py-1.5 text-[13px] font-extrabold">
            {chipText(g)}
            {(g.minute || g.type) && <span className="font-normal text-faint"> · career goal #{g.n}</span>}
          </li>
        ))}
      </ul>
      {note && <p className="text-[13px] leading-snug text-muted">{note.headline}</p>}
      {disputed && <p className="text-xs text-faint">{disputed}</p>}
      <div aria-hidden="true" className="h-[3px] rounded-full bg-hairline">
        <div className="h-[3px] w-full rounded-full bg-red" />
      </div>
    </article>
  );
}
