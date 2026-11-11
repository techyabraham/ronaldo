"use client";
import { useEffect, useRef, useState } from "react";
import { formatMmdd } from "@/lib/dates";
import { PARTNER } from "@/lib/partner";
import { PartnerStrip } from "./partner/PartnerStrip";

export type RevealData = { total: number; seasons: number; teams: { team: string; goals: number }[] };

const DURATION = 1200;

/**
 * "Checking your date" interstitial shown between the picker and the result page.
 * Lazy-loaded; never shown on direct visits. The caller navigates when `onDone` fires.
 */
export default function RevealOverlay({ mmdd, data, onDone }: { mmdd: string; data: RevealData; onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const done = useRef(false);
  const finish = useRef(onDone);
  useEffect(() => {
    finish.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / DURATION);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else if (!done.current) {
        done.current = true;
        finish.current();
      }
    };
    raf = requestAnimationFrame(tick);
    // Backstop: rAF pauses in a hidden tab (e.g. the sponsor link opened in front); timers keep running.
    const backstop = setTimeout(() => {
      if (done.current) return;
      done.current = true;
      finish.current();
    }, DURATION + 100);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(backstop);
    };
  }, []);

  const skip = () => {
    if (done.current) return;
    done.current = true;
    finish.current();
  };

  const [mm, dd] = mmdd.split("-");
  const digits = [
    { d: dd[0], tone: "bg-green text-green-ink" },
    { d: dd[1], tone: "bg-green text-green-ink" },
    { d: mm[0], tone: "bg-red text-white" },
    { d: mm[1], tone: "bg-red text-white" },
  ];
  const active = Math.min(data.teams.length - 1, Math.floor(progress * data.teams.length));
  const counter = Math.round(progress * data.total);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-bg" role="status" aria-live="polite">
      <span className="sr-only">Checking {formatMmdd(mmdd)}…</span>
      <div aria-hidden="true" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-5">
        <p className="flex items-center justify-center gap-2 text-xs font-extrabold tracking-[0.18em] text-muted">
          <span className="reveal-dot h-2 w-2 rounded-full bg-red" />
          SEARCHING RONALDO&apos;S {data.total} GOALS
        </p>

        <div className="flex items-center justify-center gap-2.5">
          {[0, 1].map((group) => (
            <div key={group} className="contents">
              {group === 1 && <span className="font-display text-4xl text-border">/</span>}
              <div className="flex gap-1.5">
                {digits.slice(group * 2, group * 2 + 2).map((x, i) => (
                  <span
                    key={i}
                    className={`flip-digit flex h-[104px] w-[70px] items-center justify-center rounded-[10px] font-display text-[72px] leading-none ${x.tone}`}
                    style={{ animationDelay: `${(group * 2 + i) * 300}ms` }}
                  >
                    {x.d}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between text-[13px] font-bold text-muted">
            <span>Rewinding {data.seasons} seasons…</span>
            <span className="tabular-nums text-text">
              {counter} / {data.total}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-hairline">
            <div className="reveal-bar h-1.5 bg-red" />
          </div>
        </div>

        <ul className="flex flex-col gap-1.5 text-sm">
          {data.teams.map((t, i) => (
            <li
              key={t.team}
              className={`flex justify-between ${i < active ? "text-faint" : i === active ? "font-extrabold text-text" : "text-border"}`}
            >
              <span>{t.team}</span>
              <span className={i === active ? "text-green-text" : ""}>
                {i < active ? `${t.goals} goals` : i === active ? "scanning…" : "up next"}
              </span>
            </li>
          ))}
        </ul>

        <p className="text-center font-display text-[26px] uppercase leading-[1.1]">
          Calling the greatest of all time to the stand…
        </p>
      </div>
      {/* Sponsor strip: outside the aria-hidden block so it stays reachable; opens a new tab, never delays this one. */}
      {PARTNER.enabled && (
        <div className="mx-auto mb-3 w-full max-w-md px-5">
          <PartnerStrip placement="loading" />
        </div>
      )}
      <button
        type="button"
        onClick={skip}
        className="mx-auto mb-[max(1.5rem,env(safe-area-inset-bottom))] inline-flex min-h-11 items-center px-4 text-sm font-bold text-red-text underline"
      >
        Skip intro
      </button>
    </div>
  );
}
