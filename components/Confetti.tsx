"use client";
import { useEffect, useState } from "react";

const COLORS = ["var(--gold)", "var(--red)", "var(--green)", "#ffffff"];

/** One CSS confetti burst on mount. Hidden entirely under prefers-reduced-motion. */
export function Confetti({ pieces = 36 }: { pieces?: number }) {
  const [items, setItems] = useState<React.CSSProperties[]>([]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let clear: ReturnType<typeof setTimeout> | undefined;
    // Wait until the page has settled so the burst never competes with first paint/hydration.
    const start = setTimeout(() => {
      setItems(
        Array.from({ length: pieces }, (_, i) => ({
          left: `${Math.random() * 100}vw`,
          background: COLORS[i % COLORS.length],
          animationDelay: `${Math.random() * 0.4}s`,
          ["--dur" as string]: `${1.6 + Math.random() * 1.4}s`,
          ["--dx" as string]: `${(Math.random() - 0.5) * 30}vw`,
          ["--rot" as string]: `${Math.random() * 720 - 360}deg`,
        })),
      );
      clear = setTimeout(() => setItems([]), 3500);
    }, 900);
    return () => {
      clearTimeout(start);
      if (clear) clearTimeout(clear);
    };
  }, [pieces]);
  if (!items.length) return null;
  return (
    <div aria-hidden="true">
      {items.map((style, i) => (
        <span key={i} className="confetti-piece" style={style} />
      ))}
    </div>
  );
}
