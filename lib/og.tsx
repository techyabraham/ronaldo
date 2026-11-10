import "server-only";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { formatMmdd } from "./dates";
import { excuseFor } from "./excuses";
import { TOTAL_GOALS, matchesForDate, nearestScoringDays, rankFamous, summarise } from "./goals";
import { competitionLabel, teamCode } from "./labels";
import { MATCH_NOTES } from "./moments";
import { heroPhotoFor, type PhotoKey } from "./photos";
import { SITE_URL } from "./site";

/* Satori rules: flexbox only, explicit display:flex on every multi-child element, no repeating gradients. */

const C = {
  bg: "#0B0B0C",
  surface: "#161618",
  text: "#FFFFFF",
  muted: "#A5A5AD",
  hairline: "#222226",
  red: "#E4222F",
  flagGreen: "#046A38",
  flagRed: "#DA291C",
};
const CROWN = "M3 18h18l-1.5-10-4.5 4-3-6-3 6-4.5-4z";

type Font = { name: string; data: Buffer; weight: 400 | 700 | 800; style: "normal" };
let fontsPromise: Promise<Font[]> | null = null;
function fonts() {
  const dir = path.join(process.cwd(), "assets", "fonts");
  fontsPromise ??= Promise.all([
    fsp
      .readFile(path.join(dir, "Anton-Regular.ttf"))
      .then((data) => ({ name: "Anton", data, weight: 400 as const, style: "normal" as const })),
    fsp
      .readFile(path.join(dir, "Archivo-700.ttf"))
      .then((data) => ({ name: "Archivo", data, weight: 700 as const, style: "normal" as const })),
    fsp
      .readFile(path.join(dir, "Archivo-900.ttf"))
      .then((data) => ({ name: "Archivo", data, weight: 800 as const, style: "normal" as const })),
  ]);
  return fontsPromise;
}

/** Optional transparent cut-out the site owner may place in public/hero/ (never fetched from the web). */
const CUTOUT = path.join(process.cwd(), "public", "hero", "siuu-cutout.png");
const cutoutDataUrl = fs.existsSync(CUTOUT)
  ? `data:image/png;base64,${fs.readFileSync(CUTOUT).toString("base64")}`
  : null;

const host = () => SITE_URL.replace(/^https?:\/\//, "");

function Crown({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d={CROWN} fill={color} />
    </svg>
  );
}

/** Words as separate flex items so a title can wrap and colour individual words. */
function Words({
  text,
  red = [],
  size,
  color = C.text,
}: {
  text: string;
  red?: string[];
  size: number;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        fontFamily: "Anton",
        fontSize: size,
        lineHeight: 0.95,
        textTransform: "uppercase",
      }}
    >
      {text.split(" ").map((w, i) => (
        <span key={i} style={{ color: red.includes(w) ? C.red : color, marginRight: size * 0.22 }}>
          {w}
        </span>
      ))}
    </div>
  );
}

/** Pre-cropped JPEGs from scripts/prepare-photos.ts (Satori can't decode WebP). */
const photoCache = new Map<string, string | null>();
function photoDataUrl(key: PhotoKey, variant: "og" | "story") {
  const id = `${key}-${variant}`;
  if (!photoCache.has(id)) {
    const file = path.join(process.cwd(), "assets", "og", `${id}.jpg`);
    photoCache.set(
      id,
      fs.existsSync(file) ? `data:image/jpeg;base64,${fs.readFileSync(file).toString("base64")}` : null,
    );
  }
  return photoCache.get(id)!;
}

/** The photo for a date's share image: famous match's team (falling back down the ranking), or the rest shot. */
function sharePhotoFor(mmdd: string): PhotoKey | null {
  const ms = rankFamous(matchesForDate(mmdd));
  if (!ms.length) return "rest";
  const m = ms.find((x) => heroPhotoFor(x.team));
  return m ? heroPhotoFor(m.team) : null;
}

/** Celebration photo with Portugal-green/red light washing in from the sides; flag + crown if no photo. */
function Panel({
  width,
  height,
  crown,
  photo,
  variant,
  fadeTo,
}: {
  width: number;
  height: number;
  crown: number;
  photo: PhotoKey | null;
  variant: "og" | "story";
  fadeTo: "left" | "bottom";
}) {
  const url = photo ? photoDataUrl(photo, variant) : null;
  if (!url) return <FlagPanel width={width} height={height} crown={crown} />;
  return (
    <div style={{ display: "flex", position: "relative", width, height }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0, width, height }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height,
          display: "flex",
          backgroundImage: `linear-gradient(90deg, rgba(4,106,56,0.55) 0%, rgba(4,106,56,0) 30%, rgba(218,41,28,0) 70%, rgba(218,41,28,0.55) 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height,
          display: "flex",
          backgroundImage:
            fadeTo === "left"
              ? `linear-gradient(90deg, ${C.bg} 0%, rgba(11,11,12,0) 22%)`
              : `linear-gradient(180deg, rgba(11,11,12,0.35) 0%, rgba(11,11,12,0) 25%, rgba(11,11,12,0) 70%, ${C.bg} 100%)`,
        }}
      />
    </div>
  );
}

function FlagPanel({ width, height, crown }: { width: number; height: number; crown: number }) {
  return (
    <div style={{ display: "flex", position: "relative", width, height }}>
      <div style={{ display: "flex", flex: 2, background: C.flagGreen }} />
      <div style={{ display: "flex", flex: 3, background: C.flagRed }} />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height,
          display: "flex",
          alignItems: cutoutDataUrl ? "flex-end" : "center",
          justifyContent: "center",
        }}
      >
        {cutoutDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cutoutDataUrl} alt="" style={{ height: height * 0.92, objectFit: "contain" }} />
        ) : (
          <Crown size={crown} color="#FFFFFF" />
        )}
      </div>
    </div>
  );
}

function Wordmark({ size, color = C.text }: { size: number; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.3 }}>
      <Crown size={size * 1.2} color={C.red} />
      <span style={{ fontFamily: "Anton", fontSize: size, color, letterSpacing: 1 }}>GOAT DAY</span>
    </div>
  );
}

function Badge({ yes, size }: { yes: boolean; size: number }) {
  return (
    <span
      style={{
        display: "flex",
        background: yes ? C.red : C.bg,
        color: C.text,
        border: yes ? "none" : `2px solid ${C.hairline}`,
        borderRadius: size * 0.35,
        padding: `${size * 0.3}px ${size * 0.55}px`,
        fontFamily: "Archivo",
        fontWeight: 800,
        fontSize: size,
        letterSpacing: size * 0.1,
      }}
    >
      {yes ? "CERTIFIED" : "REST DAY"}
    </span>
  );
}

function titleFor(count: number) {
  return count > 0
    ? {
        text: `The GOAT scored ${count} goal${count === 1 ? "" : "s"} on my birthday`,
        red: [String(count), count === 1 ? "goal" : "goals"],
      }
    : { text: "Even the GOAT rests on my birthday", red: [] as string[] };
}

/** 1200×630 link preview (artboard "Share"). */
export async function renderLinkPreview(mmdd: string) {
  const s = summarise(mmdd);
  const label = formatMmdd(mmdd).toUpperCase();
  const t = titleFor(s.count);
  return new ImageResponse(
    <div
      style={{ display: "flex", width: "100%", height: "100%", background: C.bg, color: C.text, fontFamily: "Archivo" }}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "52px 40px 48px 60px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Wordmark size={40} />
          <Badge yes={s.count > 0} size={18} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: 3, color: C.muted }}>MY BIRTHDAY · {label}</span>
          <Words text={t.text} red={t.red} size={78} />
        </div>
        <div style={{ display: "flex", fontSize: 26, fontWeight: 700 }}>
          <span>{host()}</span>
          <span style={{ color: C.muted, marginLeft: 10 }}>· Is yours a GOAT Day?</span>
        </div>
      </div>
      <Panel width={440} height={630} crown={230} photo={sharePhotoFor(mmdd)} variant="og" fadeTo="left" />
    </div>,
    { width: 1200, height: 630, fonts: await fonts() },
  );
}

/** 1080×1920 Story / Status image (artboard "Story"). */
export async function renderStory(mmdd: string) {
  const s = summarise(mmdd);
  const label = formatMmdd(mmdd).toUpperCase();
  const t = titleFor(s.count);
  const yes = s.count > 0;
  const rows = yes
    ? rankFamous(matchesForDate(mmdd))
        .slice(0, 2)
        .map((m) => {
          const note = MATCH_NOTES[m.matchId];
          const comp = competitionLabel(m.competition, m.year)
            .replace(/ \d{4}$/, "")
            .toUpperCase();
          const score = m.result ? m.result.replace(/\s*\(.*\)$/, "").replace("-", "–") : "v";
          return {
            score: `${teamCode(m.team)} ${score} ${teamCode(m.opponent)}`,
            tag: `${note?.record ? "WORLD RECORD" : comp} · ${m.year}`,
          };
        })
    : [];
  const near = yes ? null : nearestScoringDays(mmdd);
  const excuse = yes ? null : excuseFor(mmdd, { count: 0, before: near?.before, after: near?.after });

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: C.bg,
        color: C.text,
        fontFamily: "Archivo",
      }}
    >
      <div style={{ display: "flex", position: "relative", height: 900 }}>
        <Panel width={1080} height={900} crown={420} photo={sharePhotoFor(mmdd)} variant="story" fadeTo="bottom" />
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 64,
            width: 952,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Crown size={64} color="#FFFFFF" />
            <span style={{ fontFamily: "Anton", fontSize: 56 }}>GOAT DAY</span>
          </div>
          <Badge yes={yes} size={28} />
        </div>
      </div>
      <div style={{ display: "flex", height: 10 }}>
        <div style={{ display: "flex", flex: 2, background: "#18A957" }} />
        <div style={{ display: "flex", flex: 3, background: C.red }} />
      </div>
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 70px 70px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: 4, color: C.muted }}>MY BIRTHDAY · {label}</span>
          <Words text={t.text} red={t.red} size={yes ? 120 : 112} />
          {rows.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 16 }}>
              {rows.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "18px 0",
                    borderTop: `2px solid ${C.hairline}`,
                  }}
                >
                  <span style={{ fontFamily: "Anton", fontSize: 52 }}>{r.score}</span>
                  <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: 2, color: C.muted }}>{r.tag}</span>
                </div>
              ))}
            </div>
          )}
          {excuse && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginTop: 10,
                padding: 32,
                borderRadius: 28,
                background: C.surface,
              }}
            >
              <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: 4, color: C.muted }}>
                THE OFFICIAL EXCUSE
              </span>
              <span style={{ fontFamily: "Anton", fontSize: 54, textTransform: "uppercase" }}>{excuse.title}</span>
              <span style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.3 }}>{excuse.line}</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 32, fontWeight: 700 }}>{host()}</span>
          <span
            style={{
              display: "flex",
              background: C.red,
              borderRadius: 999,
              padding: "18px 34px",
              fontFamily: "Anton",
              fontSize: 38,
              textTransform: "uppercase",
            }}
          >
            Is yours a GOAT Day?
          </span>
        </div>
      </div>
    </div>,
    { width: 1080, height: 1920, fonts: await fonts() },
  );
}

/** 1200×630 home-page preview. */
export async function renderHomePreview() {
  return new ImageResponse(
    <div
      style={{ display: "flex", width: "100%", height: "100%", background: C.bg, color: C.text, fontFamily: "Archivo" }}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "52px 40px 48px 60px",
        }}
      >
        <Wordmark size={40} />
        <Words text="Did the GOAT score on your birthday?" red={["GOAT"]} size={84} />
        <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: C.muted }}>
          {TOTAL_GOALS} official goals · 366 days · {host()}
        </div>
      </div>
      <Panel width={440} height={630} crown={230} photo="portugal-back" variant="og" fadeTo="left" />
    </div>,
    { width: 1200, height: 630, fonts: await fonts() },
  );
}
