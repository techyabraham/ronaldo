import type { Team } from "./schema";

/**
 * Owner-supplied celebration photos (prepared by scripts/prepare-photos.ts into public/siu/ and assets/og/).
 * `focus` is the CSS object-position that keeps his face/upper body in frame when cropped.
 */
export type PhotoKey = "portugal-back" | "portugal" | "real-madrid" | "juventus" | "man-utd" | "al-nassr" | "rest";

export type Photo = {
  key: PhotoKey;
  /** Source dimensions after preparation (largest variant). */
  width: number;
  height: number;
  /** Widths generated in public/siu/{key}-{w}.webp */
  widths: number[];
  focus: string;
  alt: string;
};

export const PHOTOS: Record<PhotoKey, Photo> = {
  "portugal-back": {
    key: "portugal-back",
    width: 1080,
    height: 1350,
    widths: [480, 760, 1080],
    focus: "50% 22%",
    alt: "Cristiano Ronaldo, back to the camera in Portugal's number 7, landing his Siuu",
  },
  portugal: {
    key: "portugal",
    width: 512,
    height: 699,
    widths: [320, 512],
    focus: "50% 18%",
    alt: "Cristiano Ronaldo doing the Siuu in Portugal red",
  },
  "real-madrid": {
    key: "real-madrid",
    width: 472,
    height: 590,
    widths: [320, 472],
    focus: "50% 16%",
    alt: "Cristiano Ronaldo doing the Siuu in Real Madrid white",
  },
  juventus: {
    key: "juventus",
    width: 1080,
    height: 1350,
    widths: [480, 760, 1080],
    focus: "50% 18%",
    alt: "Cristiano Ronaldo doing the Siuu in Juventus black and white",
  },
  "man-utd": {
    key: "man-utd",
    width: 1080,
    height: 1350,
    widths: [480, 760, 1080],
    focus: "45% 25%",
    alt: "Cristiano Ronaldo mid-air in Manchester United's number 7",
  },
  "al-nassr": {
    key: "al-nassr",
    width: 1080,
    height: 1080,
    widths: [480, 760, 1080],
    focus: "48% 25%",
    alt: "Cristiano Ronaldo celebrating in Al Nassr yellow",
  },
  rest: {
    key: "rest",
    width: 495,
    height: 619,
    widths: [320, 495],
    focus: "50% 20%",
    alt: "Cristiano Ronaldo, mid-shout",
  },
};

/** Which photo represents each team. Sporting CP has none (flag artwork is used instead). */
const TEAM_PHOTO: Partial<Record<Team, PhotoKey>> = {
  Portugal: "portugal",
  "Real Madrid": "real-madrid",
  Juventus: "juventus",
  "Manchester United": "man-utd",
  "Al Nassr": "al-nassr",
};

/** Big hero version: Portugal uses the iconic from-behind shot. */
export function heroPhotoFor(team: Team): PhotoKey | null {
  if (team === "Portugal") return "portugal-back";
  return TEAM_PHOTO[team] ?? null;
}

export function thumbPhotoFor(team: Team): PhotoKey | null {
  return TEAM_PHOTO[team] ?? null;
}

export function srcSet(p: Photo) {
  return p.widths.map((w) => `/siu/${p.key}-${w}.webp ${w}w`).join(", ");
}

export function src(p: Photo, preferred = 480) {
  const w = p.widths.find((x) => x >= preferred) ?? p.widths.at(-1)!;
  return `/siu/${p.key}-${w}.webp`;
}
