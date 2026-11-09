import { ALL_MMDD, isValidMmdd } from "@/lib/dates";
import { renderShareImage } from "@/lib/og";

/** 1080x1080 image for Instagram / WhatsApp status, generated at build time. */
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_MMDD.map((mmdd) => ({ mmdd }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ mmdd: string }> }) {
  const { mmdd } = await params;
  if (!isValidMmdd(mmdd)) return new Response("Not found", { status: 404 });
  const img = await renderShareImage(mmdd, { width: 1080, height: 1080 });
  return new Response(img.body, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="ronaldo-birthday-${mmdd}.png"`,
      "Cache-Control": "public, max-age=86400, s-maxage=31536000",
    },
  });
}
