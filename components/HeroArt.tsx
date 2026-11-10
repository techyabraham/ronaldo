import type { PhotoKey } from "@/lib/photos";
import { CROWN_PATH } from "./icons";
import { TeamPhoto } from "./TeamPhoto";

/**
 * Hero artwork. Fills its (relatively positioned) parent.
 *
 * With a photo: the owner's celebration shot, washed with Portugal green/red light from the edges,
 * a giant outlined "SIUUU" across it, and a fade into the page so overlay text stays readable.
 * Without one (e.g. Sporting CP dates): the designed flag field with a crown.
 */
export function HeroArt({
  variant,
  photo,
  priority = false,
  grayscale = false,
}: {
  variant: "home" | "result";
  photo?: PhotoKey | null;
  priority?: boolean;
  grayscale?: boolean;
}) {
  if (photo) {
    return (
      <div className="absolute inset-0 overflow-hidden bg-bg">
        <TeamPhoto photo={photo} sizes="(max-width: 448px) 100vw, 448px" priority={priority} grayscale={grayscale} />
        {/* flag-coloured stadium light from the edges */}
        <div
          aria-hidden="true"
          className={`absolute inset-0 ${grayscale ? "opacity-80" : "opacity-60"} bg-[radial-gradient(80%_70%_at_0%_100%,var(--flag-green),transparent_70%),radial-gradient(80%_70%_at_100%_100%,var(--flag-red),transparent_70%)] mix-blend-multiply`}
        />
        <span
          aria-hidden="true"
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-display text-[150px] leading-none text-transparent opacity-50 [-webkit-text-stroke:2px_rgba(255,255,255,0.55)]"
        >
          SIUUU
        </span>
        <div
          aria-hidden="true"
          className={`absolute inset-0 bg-gradient-to-b from-bg/40 ${variant === "home" ? "via-transparent via-40%" : "via-transparent"} to-bg/90`}
        />
      </div>
    );
  }

  // Designed fallback: Portugal flag field, a big white crown, and an oversized faint "GOAT" behind it.
  // On result pages the centred play button is the focal point, so the crown is left out there.
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 flex">
        <div className="flex-[2] bg-flag-green" />
        <div className="flex-[3] bg-flag-red" />
      </div>
      <span
        className={`absolute left-1/2 ${variant === "home" ? "top-[2%]" : "top-1/2 -translate-y-1/2"} -translate-x-1/2 select-none font-display text-[180px] leading-none text-white/[0.08]`}
      >
        GOAT
      </span>
      {variant === "home" && (
        <svg
          viewBox="0 0 24 24"
          className="absolute top-[9%] left-1/2 h-[45%] w-auto -translate-x-1/2 text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          fill="currentColor"
        >
          <path d={CROWN_PATH} />
        </svg>
      )}
    </div>
  );
}
