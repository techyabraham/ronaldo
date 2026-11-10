import { ALL_MMDD, isValidMmdd } from "@/lib/dates";
import { renderLinkPreview } from "@/lib/og";
import { dateOgAlt } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_MMDD.map((mmdd) => ({ mmdd }));
}

/**
 * One image per date, with alt text that states the answer ("Ronaldo scored 4 goals on 23 June").
 * A static `alt` export can't vary by date, so this uses generateImageMetadata; the image is served at
 * /birthday/{mmdd}/opengraph-image/card. next.config.ts redirects the old /opengraph-image path here.
 */
export async function generateImageMetadata({ params }: { params: { mmdd: string } | Promise<{ mmdd: string }> }) {
  // While collecting page data Next calls this once with `{}` just to list the image ids; the id is always "card".
  const { mmdd } = ((await params) ?? {}) as { mmdd?: string };
  const alt = mmdd && isValidMmdd(mmdd) ? dateOgAlt(mmdd) : "Has Ronaldo scored on your birthday? GOAT Day";
  return [{ id: "card", alt, size: { width: 1200, height: 630 }, contentType: "image/png" }];
}

export default async function Image({ params }: { params: Promise<{ mmdd: string }> }) {
  const { mmdd } = await params;
  return renderLinkPreview(mmdd);
}
