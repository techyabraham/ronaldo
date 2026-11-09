import { ImageResponse } from "next/og";
import fs from "node:fs/promises";
import path from "node:path";
import { TOTAL_GOALS } from "@/lib/goals";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Did Ronaldo score on your birthday?";

export default async function Image() {
  const data = await fs.readFile(path.join(process.cwd(), "assets", "fonts", "Archivo-900.ttf"));
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 72,
        background:
          "radial-gradient(circle at 50% -20%, rgba(245,197,66,0.35), rgba(11,13,12,0) 60%), radial-gradient(circle at 100% 0%, rgba(226,72,61,0.28), rgba(11,13,12,0) 55%), #0b0d0c",
        color: "#f4f1e8",
        fontFamily: "Archivo",
      }}
    >
      <div
        style={{ display: "flex", fontSize: 40, color: "#f5c542" }}
      >{`${TOTAL_GOALS} official goals · 366 days`}</div>
      <div style={{ display: "flex", fontSize: 120, lineHeight: 0.95, letterSpacing: -4, marginTop: 16 }}>
        Did Ronaldo score on your birthday?
      </div>
    </div>,
    { ...size, fonts: [{ name: "Archivo", data, weight: 900, style: "normal" }] },
  );
}
