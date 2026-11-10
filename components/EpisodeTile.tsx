import type { ReactNode } from "react";
import type { PhotoKey } from "@/lib/photos";
import { TeamPhoto } from "./TeamPhoto";

export type TileTone = "red" | "green" | "neutral";

const TONE: Record<TileTone, string> = {
  red: "bg-red-deep",
  green: "bg-green-deep",
  neutral: "bg-cell-empty",
};

/** Colour wash over a photo so tiles stay on-palette and text stays readable. */
const WASH: Record<TileTone, string> = {
  red: "from-red-deep via-red-deep/55 to-red-deep/10",
  green: "from-green-deep via-green-deep/55 to-green-deep/10",
  neutral: "from-bg via-bg/55 to-bg/10",
};

/**
 * The "episode" tile used for trending dates, match thumbnails without a video, and nearest scoring
 * days: a team celebration photo washed in red/green, or flat colour when there's no photo.
 * Purely visual; the parent link or button carries the accessible name.
 */
export function EpisodeTile({
  tone,
  badge,
  badgePosition = "top-right",
  photo,
  photoSizes = "150px",
  className = "",
  children,
}: {
  tone: TileTone;
  badge?: string;
  badgePosition?: "top-right" | "bottom-right";
  photo?: PhotoKey | null;
  photoSizes?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div aria-hidden="true" className={`relative overflow-hidden rounded-xl ${TONE[tone]} ${className}`}>
      {photo ? (
        <>
          <TeamPhoto photo={photo} sizes={photoSizes} decorative />
          <div className={`absolute inset-0 bg-gradient-to-t ${WASH[tone]}`} />
        </>
      ) : (
        // soft sheen so flat colour reads as a "thumbnail", not an empty box
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_100%_0%,rgba(255,255,255,0.14),transparent_55%)]" />
      )}
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
