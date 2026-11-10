/**
 * Builds the raster icons from app/icon.svg (the source of truth: the GOAT Day crown over the
 * Portugal flag bar). Writes app/favicon.ico (16, 32, 48) and app/apple-icon.png (180, full bleed:
 * iOS rounds the corners itself). Run after editing the SVG:
 *
 *   npx tsx scripts/make-icons.ts
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const APP = path.join(process.cwd(), "app");
const svg = fs.readFileSync(path.join(APP, "icon.svg"), "utf8");
// Square corners for the Apple icon; the OS applies its own mask.
const squareSvg = svg.replace(/ rx="\d+"/, "");

const png = (source: string, size: number) =>
  sharp(Buffer.from(source), { density: (72 * size) / 64 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();

/** ICO container holding PNG images (supported by every current browser). */
function ico(images: { size: number; data: Buffer }[]) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  const dir = Buffer.alloc(16 * images.length);
  let offset = 6 + dir.length;
  images.forEach(({ size, data }, i) => {
    const o = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, o); // width
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1); // height
    dir.writeUInt8(0, o + 2); // palette
    dir.writeUInt8(0, o + 3); // reserved
    dir.writeUInt16LE(1, o + 4); // colour planes
    dir.writeUInt16LE(32, o + 6); // bits per pixel
    dir.writeUInt32LE(data.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += data.length;
  });
  return Buffer.concat([header, dir, ...images.map((x) => x.data)]);
}

async function main() {
  const sizes = [16, 32, 48];
  const images = await Promise.all(sizes.map(async (size) => ({ size, data: await png(svg, size) })));
  fs.writeFileSync(path.join(APP, "favicon.ico"), ico(images));
  fs.writeFileSync(path.join(APP, "apple-icon.png"), await png(squareSvg, 180));
  console.log("Wrote app/favicon.ico (16, 32, 48) and app/apple-icon.png (180)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
