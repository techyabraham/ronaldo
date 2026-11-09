import { ALL_MMDD } from "@/lib/dates";
import { renderLinkPreview } from "@/lib/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "GOAT Day: did the GOAT score on my birthday?";
export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_MMDD.map((mmdd) => ({ mmdd }));
}

export default async function Image({ params }: { params: Promise<{ mmdd: string }> }) {
  const { mmdd } = await params;
  return renderLinkPreview(mmdd);
}
