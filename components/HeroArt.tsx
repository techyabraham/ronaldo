import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import { CROWN_PATH } from "./icons";

/** Checked once at build time: the photo is only used if the site owner has placed a licensed file. */
const HERO_FILE = "hero/siuu.webp";
const hasHeroPhoto = fs.existsSync(path.join(process.cwd(), "public", HERO_FILE));

/**
 * Hero artwork. Fills its (relatively positioned) parent.
 * With `public/hero/siuu.webp` present it shows that photo; otherwise the designed flag-field fallback.
 * Never fetches or hot-links photos from anywhere else.
 */
export function HeroArt({ variant, priority = false }: { variant: "home" | "result"; priority?: boolean }) {
  if (hasHeroPhoto) {
    return (
      <div className="absolute inset-0">
        <Image
          src={`/${HERO_FILE}`}
          alt="Cristiano Ronaldo's celebration"
          fill
          priority={priority}
          sizes={variant === "home" ? "(max-width: 448px) 100vw, 448px" : "(max-width: 448px) 100vw, 448px"}
          className="object-cover"
          style={{ objectPosition: "center 20%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg" />
      </div>
    );
  }

  // Designed fallback: Portugal flag field, a big white crown, and an oversized faint "GOAT" behind it.
  // On result pages the centred play button is the focal point, so the crown is left out there.
  const crownTop = "top-[9%]";
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
          className={`absolute left-1/2 ${crownTop} h-[45%] w-auto -translate-x-1/2 text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]`}
          fill="currentColor"
        >
          <path d={CROWN_PATH} />
        </svg>
      )}
    </div>
  );
}
