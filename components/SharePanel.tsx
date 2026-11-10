"use client";
import type { SharePayload } from "@/lib/share";
import { useShare } from "@/lib/useShare";
import { FlagBar } from "./FlagBar";
import {
  CrownIcon,
  FacebookIcon,
  LinkIcon,
  StoryIcon,
  TelegramIcon,
  ThreadsIcon,
  UploadIcon,
  WhatsAppIcon,
  XIcon,
} from "./icons";
import { shareBtn } from "./shareStyles";

export type SharePreview = { label: string; count: number };

const brandCls =
  "flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border border-border bg-surface-2 px-1 text-xs font-extrabold text-text";

/**
 * The full share card, placed after the goals (watching comes first; quick-share buttons already sit under
 * the answer). Shows a small HTML version of the link preview, then every share option: WhatsApp,
 * Status / Story, X, Facebook, Telegram, Threads, the OS sheet and copy.
 */
export function SharePanel({
  mmdd,
  url,
  payload,
  preview,
  imagePath,
}: {
  mmdd: string;
  url: string;
  payload: SharePayload;
  preview: SharePreview;
  imagePath: string;
}) {
  const s = useShare({ mmdd, payload, placement: "panel", imagePath });
  const host = url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const yes = preview.count > 0;
  return (
    <section id="share" aria-labelledby="share-h" className="scroll-mt-16 rounded-[20px] bg-surface p-4">
      <h2 id="share-h" className="text-lg font-extrabold">
        Show the group chat
      </h2>
      <p className="mt-1 text-sm text-muted">
        {yes
          ? `Post it before they check theirs. Bet they can't beat ${preview.count}.`
          : "Dare them to check theirs. Is their birthday a GOAT Day?"}
      </p>

      {/* Small HTML replica of the 1200×630 link card friends will see (no image download). */}
      <div aria-hidden="true" className="mt-3 overflow-hidden rounded-xl border border-border bg-bg">
        <div className="flex aspect-[1200/630]">
          <div className="flex min-w-0 flex-[1.7] flex-col justify-between p-3">
            <div className="flex items-center gap-1.5">
              <CrownIcon className="h-3.5 w-3.5 text-red" />
              <span className="font-display text-[11px] leading-none">GOAT DAY</span>
              <span
                className={`rounded-[3px] px-1 py-px text-[7px] font-extrabold tracking-[0.08em] ${yes ? "bg-red text-white" : "bg-surface-2 text-text"}`}
              >
                {yes ? "CERTIFIED" : "REST DAY"}
              </span>
            </div>
            <div>
              <p className="text-[7px] font-extrabold tracking-[0.14em] text-muted">MY BIRTHDAY · {preview.label}</p>
              <p className="mt-0.5 font-display text-[19px] uppercase leading-[0.95]">
                {yes ? (
                  <>
                    The GOAT scored <span className="text-red-text">{preview.count}</span> goal
                    {preview.count === 1 ? "" : "s"} on my birthday
                  </>
                ) : (
                  "Even the GOAT rests on my birthday"
                )}
              </p>
            </div>
            <p className="truncate text-[8px] text-muted">{host} · Is yours a GOAT Day?</p>
          </div>
          <div className="relative flex flex-1">
            <div className="flex-[2] bg-flag-green" />
            <div className="flex-[3] bg-flag-red" />
            <CrownIcon className="absolute inset-0 m-auto h-1/2 w-1/2 text-white" />
          </div>
        </div>
        <FlagBar height={3} className="rounded-none" />
      </div>

      <div className="mt-3 grid gap-2">
        <a
          href={s.links.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => s.log("whatsapp")}
          className={`${shareBtn.whatsapp} min-h-14 text-[17px]`}
        >
          <WhatsAppIcon className="h-6 w-6" /> Send on WhatsApp
        </a>
        <button type="button" onClick={s.image} className={`${shareBtn.primary} min-h-14 text-[17px]`}>
          <StoryIcon className="h-6 w-6" /> Post to Status / Story
        </button>
        <div className="grid grid-cols-4 gap-2">
          <a href={s.links.x} target="_blank" rel="noopener noreferrer" onClick={() => s.log("x")} className={brandCls}>
            <XIcon />
            <span aria-hidden="true">X</span>
            <span className="sr-only">Share on X</span>
          </a>
          <a
            href={s.links.facebook}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => s.log("facebook")}
            className={brandCls}
          >
            <FacebookIcon />
            Facebook
          </a>
          <a
            href={s.links.telegram}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => s.log("telegram")}
            className={brandCls}
          >
            <TelegramIcon />
            Telegram
          </a>
          <a
            href={s.links.threads}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => s.log("threads")}
            className={brandCls}
          >
            <ThreadsIcon />
            Threads
          </a>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {s.canNative && (
            <button type="button" onClick={s.native} className={shareBtn.neutral}>
              <UploadIcon /> More apps
            </button>
          )}
          <button type="button" onClick={s.copy} className={`${shareBtn.neutral} ${s.canNative ? "" : "col-span-2"}`}>
            <LinkIcon /> Copy message
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs text-faint">
        Instagram &amp; TikTok: tap <strong className="text-muted">Post to Status / Story</strong>, then add a link
        sticker with the copied link.
      </p>
      <p role="status" aria-live="polite" className="pt-2 text-center text-sm font-bold text-green-text empty:hidden">
        {s.toast}
      </p>
    </section>
  );
}
