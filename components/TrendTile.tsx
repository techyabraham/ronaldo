import Link from "next/link";
import { EpisodeTile, type TileTone } from "./EpisodeTile";

/** One tile in the "Trending birthdays" row. Presentational; safe in server and client components. */
export function TrendTile({
  mmdd,
  short,
  label,
  count,
  max,
  caption,
  tone,
}: {
  mmdd: string;
  short: string;
  label: string;
  count: number;
  max: number;
  caption: string;
  tone: TileTone;
}) {
  return (
    <Link
      href={`/birthday/${mmdd}`}
      className="flex w-[150px] flex-col gap-1.5 text-text"
      aria-label={`${label}: ${count ? `${count} goal${count === 1 ? "" : "s"}` : "no goals"}. ${caption}`}
    >
      <EpisodeTile
        tone={tone}
        badge={count ? `${count} GOAL${count === 1 ? "" : "S"}` : undefined}
        className="h-[92px]"
      >
        <span className="absolute bottom-2.5 left-2.5 font-display text-[30px] leading-none">{short}</span>
      </EpisodeTile>
      <span className="h-[3px] overflow-hidden rounded-full bg-hairline" aria-hidden="true">
        <span className="block h-full rounded-full bg-red" style={{ width: `${max ? (count / max) * 100 : 0}%` }} />
      </span>
      <span className="truncate text-[13px] font-bold">{caption}</span>
    </Link>
  );
}
