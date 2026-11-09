import { ALL_MMDD, isValidMmdd } from "@/lib/dates";
import { renderStory } from "@/lib/og";

/** 1080×1920 image for WhatsApp Status / Instagram & TikTok Stories, generated at build time. */
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_MMDD.map((mmdd) => ({ mmdd }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ mmdd: string }> }) {
  const { mmdd } = await params;
  if (!isValidMmdd(mmdd)) return new Response("Not found", { status: 404 });
  const img = await renderStory(mmdd);
  return new Response(img.body, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="goat-day-${mmdd}.png"`,
      "Cache-Control": "public, max-age=86400, s-maxage=31536000",
    },
  });
}
