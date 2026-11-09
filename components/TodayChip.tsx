"use client";
import Link from "next/link";
import { todayMmdd } from "@/lib/dates";
import { useClientValue } from "@/lib/useClientValue";
import { chipCls } from "./chip";

/** "Today" depends on the viewer's own calendar, so it only renders in the browser. */
export function TodayChip({ counts }: { counts: Record<string, number> }) {
  const today = useClientValue<string | null>(() => todayMmdd(), null);
  if (!today) return null;
  const n = counts[today] ?? 0;
  return (
    <Link href={`/birthday/${today}`} className={chipCls}>
      <span aria-hidden="true">📅</span> Today
      <span className="text-muted font-normal">{n ? `· ${n} goal${n === 1 ? "" : "s"}` : ""}</span>
    </Link>
  );
}
