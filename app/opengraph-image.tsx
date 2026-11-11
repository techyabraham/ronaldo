import { renderHomePreview } from "@/lib/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Literal (not imported from lib/seo) so this image route doesn't pull the goal data in.
export const alt = "Has Ronaldo scored on your birthday? GOAT Day";

export default function Image() {
  return renderHomePreview();
}
