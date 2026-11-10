import type { Match } from "@/lib/goals";
import { competitionLabel } from "@/lib/labels";
import type { MatchNote } from "@/lib/moments";
import { thumbPhotoFor } from "@/lib/photos";
import { youtubeSearchUrl, type SharePayload } from "@/lib/share";
import { EpisodeTile } from "./EpisodeTile";
import { PlayIcon } from "./icons";
import { ShareGoalButton } from "./ShareGoalButton";
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
export function MatchCard({
  m,
  index,
  mmdd,
  note,
  pageUrl,
  label,
}: {
  m: Match;
  index: number;
  mmdd: string;
  note?: MatchNote;
  /** The date page URL; the goal share links to this match card within it. */
  pageUrl: string;
  /** "23 June" */
  label: string;
}) {
  const n = m.goals.length;
  const badge = `${n} GOAL${n === 1 ? "" : "S"}`;
  const scoreline = m.result ? `${m.team} ${dash(m.result)} ${m.opponent}` : `${m.team} vs ${m.opponent}`;
  const comp = [competitionLabel(m.competition, m.year), m.stage].filter(Boolean).join(" · ");
  const disputed = m.goals.find((g) => g.notes)?.notes;
  const goalPayload: SharePayload = {
    kind: "goal",
    label,
    url: `${pageUrl}#m-${m.matchId}`,
    match: {
      team: m.team,
      opponent: m.opponent,
      year: m.year,
      competition: m.competition,
      stage: m.stage,
      goals: n,
    },
  };

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
    <article id={`m-${m.matchId}`} className="flex scroll-mt-14 flex-col gap-2.5" aria-labelledby={`ep-${m.matchId}`}>
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
          opponent={m.opponent}
          year={m.year}
          eager={index === 1}
        >
          {details}
        </VideoEpisode>
      ) : (
        <div className="flex gap-3">
          <a href={youtubeSearchUrl(m)} target="_blank" rel="noopener noreferrer" className="relative flex-none">
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
              <span className="absolute bottom-1.5 left-1.5 rounded bg-bg/80 px-1.5 py-0.5 text-[11px] font-extrabold text-white">
                YouTube ↗
              </span>
            </EpisodeTile>
            <span className="sr-only">
              Watch {m.team} vs {m.opponent}, {m.year}: {n} goal{n === 1 ? "" : "s"} (opens YouTube)
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
      <ShareGoalButton mmdd={mmdd} payload={goalPayload} />
      {disputed && <p className="text-xs text-faint">{disputed}</p>}
      <div aria-hidden="true" className="h-[3px] rounded-full bg-hairline">
        <div className="h-[3px] w-full rounded-full bg-red" />
      </div>
    </article>
  );
}
