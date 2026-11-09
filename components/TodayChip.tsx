"use client";
import { formatMmdd, shortLabel, todayMmdd } from "@/lib/dates";
import { useClientValue } from "@/lib/useClientValue";
import { TrendTile } from "./TrendTile";

/** "Today" tile: depends on the viewer's own calendar, so it only renders in the browser. */
export function TodayChip({ counts, max }: { counts: Record<string, number>; max: number }) {
  const today = useClientValue<string | null>(() => todayMmdd(), null);
  // Reserve the tile's space before hydration so the row doesn't jump.
  if (!today) return <div aria-hidden="true" className="h-[127px] w-[150px]" />;
  const n = counts[today] ?? 0;
  return (
    <TrendTile
      mmdd={today}
      short={shortLabel(today)}
      label={formatMmdd(today)}
      count={n}
      max={max}
      caption="Today"
      tone={n ? "red" : "neutral"}
    />
  );
}
