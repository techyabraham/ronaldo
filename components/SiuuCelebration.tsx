"use client";
import { useEffect, useState } from "react";

const COLORS = ["var(--red)", "var(--green)", "#ffffff"];

type Piece = React.CSSProperties;

/**
 * SIUUU! A one-shot, CSS-only celebration on result pages with goals.
 *
 *  0.00s  "SIU" springs in
 *  0.35s  the U stretches into "UUU", as if shouted
 *  0.90s  the landing: a jolt, red/green shockwave rings, confetti in flag colours
 *  1.55s  fades out, then flashes the CERTIFIED GOAT DAY badge
 *
 * Decorative only (aria-hidden, pointer-events: none). The word is SVG <text>, which browsers don't
 * treat as a Largest Contentful Paint candidate, so the effect can't slow the page's LCP. Mounted after
 * hydration and skipped entirely under prefers-reduced-motion.
 */
export function SiuuCelebration() {
  const [pieces, setPieces] = useState<Piece[] | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let raf = 0;
    let idle = 0;
    // Start once the page has loaded and the main thread is idle, so the celebration never
    // competes with hydration (keeps Total Blocking Time down on cheap phones).
    const begin = () => {
      const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1));
      idle = ric(() => (raf = requestAnimationFrame(start)), { timeout: 800 });
    };
    const start = () => {
      setPieces(
        Array.from({ length: 42 }, (_, i) => ({
          left: `${50 + (Math.random() - 0.5) * 70}vw`,
          background: COLORS[i % COLORS.length],
          animationDelay: `${0.9 + Math.random() * 0.25}s`,
          ["--dur" as string]: `${1.4 + Math.random() * 1.2}s`,
          ["--dx" as string]: `${(Math.random() - 0.5) * 40}vw`,
          ["--rot" as string]: `${Math.random() * 720 - 360}deg`,
        })),
      );
      timers.push(
        setTimeout(() => {
          document.querySelector<HTMLElement>("[data-certified]")?.animate(
            [
              { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(228,34,47,0)" },
              { transform: "scale(1.12)", boxShadow: "0 0 0 8px rgba(228,34,47,0.35)" },
              { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(228,34,47,0)" },
            ],
            { duration: 650, easing: "ease-out" },
          );
        }, 1900),
        setTimeout(() => setPieces(null), 3200),
      );
    };
    if (document.readyState === "complete") begin();
    else window.addEventListener("load", begin, { once: true });
    return () => {
      window.removeEventListener("load", begin);
      if (idle) (window.cancelIdleCallback ?? window.clearTimeout)(idle);
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, []);

  if (!pieces) return null;
  return (
    <div aria-hidden="true" data-testid="siuu" className="pointer-events-none fixed inset-0 z-[65]">
      <div className="siuu-vignette absolute inset-0" />
      <div className="siuu-out absolute inset-0 flex items-center justify-center">
        <span className="siuu-ring absolute h-40 w-40 rounded-full border-[6px] border-red" />
        <span className="siuu-ring siuu-ring-2 absolute h-40 w-40 rounded-full border-[6px] border-green" />
        <svg
          viewBox="0 0 600 220"
          className="siuu-jolt w-[min(92vw,440px)] overflow-visible drop-shadow-[0_12px_30px_rgba(0,0,0,0.55)]"
        >
          <g style={{ fontFamily: "var(--font-anton), Impact, sans-serif" }} fontSize="170">
            <text
              x="320"
              y="175"
              textAnchor="end"
              fill="#fff"
              stroke="var(--red)"
              strokeWidth="10"
              paintOrder="stroke"
              className="siuu-pop"
            >
              SIU
            </text>
            <text
              x="322"
              y="175"
              textAnchor="start"
              fill="#fff"
              stroke="var(--green)"
              strokeWidth="10"
              paintOrder="stroke"
              className="siuu-stretch"
            >
              UU
            </text>
          </g>
        </svg>
      </div>
      {pieces.map((style, i) => (
        <span key={i} className="confetti-piece" style={style} />
      ))}
    </div>
  );
}
