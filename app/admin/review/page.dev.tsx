import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Goal, Videos } from "@/lib/schema";
import { ReviewList, type ReviewItem } from "./ReviewList";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Video review (dev)", robots: { index: false } };

const STATUSES = ["auto", "verified", "missing", "rejected", "none"];

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();
  const sp = await searchParams;
  const filter = typeof sp.status === "string" ? sp.status : "auto";
  const read = <T,>(f: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", f), "utf8")) as T;
  const goals = read<Goal[]>("goals.json");
  const videos = read<Videos>("videos.json");

  const matches = new Map<string, ReviewItem>();
  for (const g of goals) {
    const m = matches.get(g.matchId);
    if (m) m.goals.push(g.minute ? `${g.minute}'` : "?");
    else
      matches.set(g.matchId, {
        matchId: g.matchId,
        date: g.date,
        title: `${g.team} vs ${g.opponent}`,
        competition: [g.competition, g.stage].filter(Boolean).join(" · "),
        goals: [g.minute ? `${g.minute}'` : "?"],
        video: videos[g.matchId] ?? null,
      });
  }
  const all = [...matches.values()].sort((a, b) => b.date.localeCompare(a.date));
  const items = all.filter((m) => (filter === "none" ? !m.video : m.video?.status === filter));
  const counts: Record<string, number> = {};
  for (const m of all) counts[m.video?.status ?? "none"] = (counts[m.video?.status ?? "none"] ?? 0) + 1;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-black">
        Video review <span className="text-sm text-muted">(dev only)</span>
      </h1>
      <nav className="mt-3 flex flex-wrap gap-2 text-sm">
        {STATUSES.map((s) => (
          <a
            key={s}
            href={`?status=${s}`}
            className={`rounded-full border px-3 py-1 ${s === filter ? "border-gold text-gold" : "border-border"}`}
          >
            {s} ({counts[s] ?? 0})
          </a>
        ))}
      </nav>
      <ReviewList items={items.slice(0, 100)} />
    </div>
  );
}
