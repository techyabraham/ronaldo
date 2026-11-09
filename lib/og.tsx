import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { formatMmdd } from "./dates";
import { matchesForDate, nearestScoringDays, pickFamous, summarise } from "./goals";
import { SITE_URL } from "./site";

let fontsPromise: Promise<{ name: string; data: Buffer; weight: 700 | 900; style: "normal" }[]> | null = null;
function fonts() {
  fontsPromise ??= Promise.all(
    ([700, 900] as const).map(async (weight) => ({
      name: "Archivo",
      data: await fs.readFile(path.join(process.cwd(), "assets", "fonts", `Archivo-${weight}.ttf`)),
      weight,
      style: "normal" as const,
    })),
  );
  return fontsPromise;
}

const C = {
  bg: "#0b0d0c",
  text: "#f4f1e8",
  muted: "#a9b0aa",
  gold: "#f5c542",
  red: "#e2483d",
  green: "#2fbf71",
  surface: "#151917",
};

export async function renderShareImage(mmdd: string, size: { width: number; height: number }) {
  const s = summarise(mmdd);
  const matches = matchesForDate(mmdd);
  const famous = matches.length ? pickFamous(matches) : null;
  const near = s.count ? null : nearestScoringDays(mmdd);
  const square = size.width === size.height;
  const host = SITE_URL.replace(/^https?:\/\//, "");
  const label = formatMmdd(mmdd).toUpperCase();
  const pad = square ? 80 : 64;

  const famousLine = famous
    ? `${famous.stage && /Final|Semi|Quarter|Round of/.test(famous.stage) ? `${famous.competition} ${famous.stage}` : famous.competition} · ${famous.team} vs ${famous.opponent} · ${famous.year}`
    : near?.after
      ? `But he scored ${near.after.offset} day${near.after.offset === 1 ? "" : "s"} later, ${near.after.headline}`
      : "";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: pad,
        background: `radial-gradient(circle at 50% -20%, rgba(245,197,66,0.35), rgba(11,13,12,0) 60%), radial-gradient(circle at 100% 0%, rgba(226,72,61,0.28), rgba(11,13,12,0) 55%), ${C.bg}`,
        color: C.text,
        fontFamily: "Archivo",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: square ? 34 : 28,
          fontWeight: 700,
        }}
      >
        <div style={{ display: "flex" }}>
          <span>Scored</span>
          <span style={{ color: C.gold }}>On</span>
          <span>My</span>
          <span style={{ color: C.gold }}>Birthday</span>
        </div>
        {!square && <div style={{ display: "flex", color: C.muted }}>Did Ronaldo score on your birthday?</div>}
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{ display: "flex", fontSize: square ? 64 : 52, fontWeight: 900, color: C.muted, letterSpacing: -1 }}
        >
          {label}
        </div>
        {s.count ? (
          <div
            style={{ display: "flex", alignItems: "baseline", fontWeight: 900, letterSpacing: -4, lineHeight: 0.95 }}
          >
            <span style={{ fontSize: square ? 190 : 170, color: C.green }}>YES</span>
            <span style={{ fontSize: square ? 110 : 96, color: C.text, marginLeft: 28 }}>—</span>
            <span style={{ fontSize: square ? 190 : 170, color: C.gold, marginLeft: 28 }}>{s.count}</span>
            <span style={{ fontSize: square ? 90 : 80, color: C.text, marginLeft: 20 }}>
              {s.count === 1 ? "GOAL" : "GOALS"}
            </span>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              fontSize: square ? 150 : 140,
              fontWeight: 900,
              letterSpacing: -4,
              lineHeight: 0.95,
            }}
          >
            NOT THIS DAY
          </div>
        )}
        {mmdd === "02-05" && (
          <div style={{ display: "flex", marginTop: 20, fontSize: square ? 40 : 34, fontWeight: 900, color: C.gold }}>
            Happy birthday to you AND Cristiano!
          </div>
        )}
        {famousLine && (
          <div
            style={{
              display: "flex",
              marginTop: 24,
              fontSize: square ? 38 : 34,
              fontWeight: 700,
              color: C.text,
              maxWidth: size.width - pad * 2,
            }}
          >
            {famousLine}
          </div>
        )}
        {s.count > 0 && (
          <div style={{ display: "flex", marginTop: 10, fontSize: square ? 30 : 28, color: C.muted }}>
            {`for ${s.teams.join(", ")} · ${s.years.length} different year${s.years.length === 1 ? "" : "s"}`}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: square ? 34 : 30,
          fontWeight: 700,
        }}
      >
        <div style={{ display: "flex", color: C.gold }}>{`${host}/birthday/${mmdd}`}</div>
        <div style={{ display: "flex", background: C.gold, color: "#1a1405", padding: "12px 24px", borderRadius: 999 }}>
          Check yours
        </div>
      </div>
    </div>,
    { ...size, fonts: await fonts() },
  );
}
