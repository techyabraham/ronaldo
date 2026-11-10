/**
 * Turns the owner's celebration photos into web + share-image assets.
 *
 *   npx tsx scripts/prepare-photos.ts "C:/path/to/photo/folder"
 *
 * Writes:
 *   public/siu/{key}-{w}.webp   responsive web images (EXIF stripped)
 *   assets/og/{key}-og.jpg      440×630 crop for the 1200×630 link preview
 *   assets/og/{key}-story.jpg   1080×900 crop for the Story image
 *
 * Only add photos you have the rights to use. Don't crop or edit out photographer/agency watermarks.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { PHOTOS, type PhotoKey } from "../lib/photos";
import { ROOT, log } from "./lib/util";

/** Source file for each key (names as delivered in the owner's folder). */
const SOURCES: Record<PhotoKey, string> = {
  "portugal-back": "siu-portugal-back.webp",
  portugal: "siu-Portugal.webp",
  "real-madrid": "siu-real.jpg",
  juventus: "siu-juventus.jpg",
  "man-utd": "siu-back-manu.jpg",
  "al-nassr": "siu-cristiano-ronaldo-al-nassr.webp",
  rest: "siu.jfif",
};

/** object-position percentages -> sharp crop gravity offsets for the share-image crops. */
function cropBox(srcW: number, srcH: number, outW: number, outH: number, focus: string) {
  const [fx, fy] = focus.split(" ").map((v) => parseFloat(v) / 100);
  const scale = Math.max(outW / srcW, outH / srcH);
  const w = Math.round(srcW * scale);
  const h = Math.round(srcH * scale);
  const left = Math.round(Math.min(Math.max(0, (w - outW) * fx), w - outW));
  const top = Math.round(Math.min(Math.max(0, (h - outH) * fy), h - outH));
  return { w, h, left, top };
}

async function main() {
  const dir = process.argv[2];
  if (!dir || !fs.existsSync(dir)) throw new Error("Usage: tsx scripts/prepare-photos.ts <photo folder>");
  const webDir = path.join(ROOT, "public", "siu");
  const ogDir = path.join(ROOT, "assets", "og");
  fs.mkdirSync(webDir, { recursive: true });
  fs.mkdirSync(ogDir, { recursive: true });

  for (const [key, file] of Object.entries(SOURCES) as [PhotoKey, string][]) {
    const p = PHOTOS[key];
    const input = path.join(dir, file);
    const base = sharp(input).rotate(); // honour EXIF orientation, then metadata is dropped on output
    const meta = await base.metadata();
    for (const w of p.widths) {
      await base
        .clone()
        .resize({ width: Math.min(w, meta.width!), withoutEnlargement: true })
        .webp({ quality: 72, effort: 6 })
        .toFile(path.join(webDir, `${key}-${w}.webp`));
    }
    for (const [suffix, W, H] of [
      ["og", 440, 630],
      ["story", 1080, 900],
    ] as const) {
      const b = cropBox(meta.width!, meta.height!, W, H, p.focus);
      let img = base.clone().resize(b.w, b.h).extract({ left: b.left, top: b.top, width: W, height: H });
      if (key === "rest") img = img.grayscale();
      await img.jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(ogDir, `${key}-${suffix}.jpg`));
    }
    log("photos", `${key}: ${p.widths.join("/")}w + og + story`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
