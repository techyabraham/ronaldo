import { formatMmdd } from "@/lib/dates";
import { goalsForDate, matchesForDate, pickFamous, summarise } from "@/lib/goals";
import { shareText, type ShareMatch } from "@/lib/share";
import { SITE_URL } from "@/lib/site";

/** Everything both result layouts need, computed once at build time. */
export function resultContext(mmdd: string) {
  const s = summarise(mmdd);
  const matches = matchesForDate(mmdd);
  const label = formatMmdd(mmdd);
  const famous = matches.length ? pickFamous(matches) : null;
  const highlight: ShareMatch | null = famous
    ? {
        opponent: famous.opponent,
        year: famous.year,
        competition: famous.competition,
        stage: famous.stage,
        goals: famous.goals.length,
      }
    : null;
  const hisBirthday = mmdd === "02-05";
  return {
    s,
    matches,
    famous,
    label,
    url: `${SITE_URL}/birthday/${mmdd}`,
    // Square image until M5 swaps in the 1080×1920 Story image.
    imagePath: `/birthday/${mmdd}/square`,
    text: shareText({ count: s.count, label, highlight, hisBirthday }),
    hisBirthday,
  };
}

/** 5 Feb and 29 Feb get their own banner above the title block. */
export function SpecialBanner({ mmdd }: { mmdd: string }) {
  if (mmdd === "02-05") {
    const never = goalsForDate("02-05").length === 0;
    return (
      <p className="rounded-[18px] bg-surface px-4 py-3 text-[15px] font-bold leading-snug">
        You share a birthday with the GOAT (5 February 1985).
        {never && (
          <span className="block font-normal text-muted">He&apos;s never scored on his own birthday either.</span>
        )}
      </p>
    );
  }
  if (mmdd === "02-29") {
    return (
      <p className="rounded-[18px] bg-surface px-4 py-3 text-[15px] font-bold leading-snug">
        Leap-year legend. Your birthday only shows up every four years — even the GOAT can&apos;t schedule around that.
      </p>
    );
  }
  return null;
}
