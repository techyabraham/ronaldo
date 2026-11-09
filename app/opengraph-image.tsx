import { renderHomePreview } from "@/lib/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "GOAT Day: did the GOAT score on your birthday?";

export default function Image() {
  return renderHomePreview();
}
