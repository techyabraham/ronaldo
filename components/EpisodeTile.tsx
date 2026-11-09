import type { ReactNode } from "react";

export type TileTone = "red" | "green" | "neutral";

const TONE: Record<TileTone, string> = {
  red: "bg-red-deep",
  green: "bg-green-deep",
  neutral: "bg-cell-empty",
};

/**
 * The deep-colour "episode" tile used for trending dates, match thumbnails without a video,
 * and nearest scoring days. Purely visual; the parent link or button carries the accessible name.
 */
export function EpisodeTile({
  tone,
  badge,
  badgePosition = "top-right",
  className = "",
  children,
}: {
  tone: TileTone;
  badge?: string;
  badgePosition?: "top-right" | "bottom-right";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl ${TONE[tone]} ${className}`}>
      {/* soft sheen so flat colour reads as a "thumbnail", not an empty box */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(120%_90%_at_100%_0%,rgba(255,255,255,0.14),transparent_55%)]"
      />
      {children}
      {badge && (
        <span
          className={`absolute ${badgePosition === "top-right" ? "top-2 right-2" : "right-1.5 bottom-1.5"} rounded-[5px] bg-bg px-1.5 py-0.5 text-[11px] font-extrabold tracking-[0.04em] text-white`}
        >
          {badge}
        </span>
      )}
    </div>
  );
}
