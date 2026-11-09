"use client";
import { useShare } from "@/lib/useShare";
import { WhatsAppIcon, shareBtn } from "./shareStyles";

export type SharePreview = { label: string; big: string; small: string; yes: boolean };

/**
 * The main share card, placed directly under the result headline: a preview of what friends will see,
 * then share actions ordered by how this audience shares (WhatsApp and Status first).
 */
export function SharePanel({
  mmdd,
  url,
  text,
  preview,
}: {
  mmdd: string;
  url: string;
  text: string;
  preview: SharePreview;
}) {
  const s = useShare({ mmdd, url, text, placement: "panel", imagePath: `/birthday/${mmdd}/square` });
  const host = url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return (
    <section
      id="share"
      aria-labelledby="share-h"
      className="scroll-mt-4 rounded-3xl border-2 border-gold bg-surface p-4 shadow-[0_0_40px_-12px_var(--gold)]"
    >
      <h2 id="share-h" className="text-2xl font-black leading-tight">
        {preview.yes ? "Show your friends 🔥" : "Tell your friends 😅"}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {preview.yes
          ? "Post it before they find out theirs. Bet they can't beat it."
          : "Dare them to check theirs. Will Ronaldo score on their day?"}
      </p>

      {/* Mini preview of the link card / status image (HTML, so it costs no extra download). */}
      <div aria-hidden="true" className="mt-4 overflow-hidden rounded-2xl border border-border bg-bg">
        <div className="bg-pitch px-4 py-4">
          <p className="text-xs font-black uppercase tracking-widest text-muted">{preview.label}</p>
          <p
            className={`mt-1 text-4xl font-black leading-none tracking-tight ${preview.yes ? "text-green" : "text-text"}`}
          >
            {preview.big}
          </p>
          {preview.small && <p className="mt-2 text-sm font-bold leading-snug">{preview.small}</p>}
        </div>
        <p className="border-t border-border px-4 py-2 text-xs text-muted">
          {host} · Did Ronaldo score on your birthday?
        </p>
      </div>

      <div className="mt-4 grid gap-2">
        <a
          href={s.links.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => s.log("whatsapp")}
          className={`${shareBtn.whatsapp} min-h-14 text-lg`}
        >
          <WhatsAppIcon className="h-6 w-6" /> Send on WhatsApp
        </a>
        <button type="button" onClick={s.image} className={`${shareBtn.primary} min-h-14 text-lg`}>
          <span aria-hidden="true">📸</span> Post to Status / Story
        </button>
        <div className="grid grid-cols-3 gap-2">
          <a
            href={s.links.x}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => s.log("x")}
            className={shareBtn.x}
          >
            <span aria-hidden="true">𝕏</span>
            <span className="sr-only">Share on X</span>
          </a>
          <a
            href={s.links.facebook}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => s.log("facebook")}
            className={shareBtn.facebook}
          >
            Facebook
          </a>
          <a
            href={s.links.telegram}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => s.log("telegram")}
            className={shareBtn.telegram}
          >
            Telegram
          </a>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {s.canNative && (
            <button type="button" onClick={s.native} className={shareBtn.neutral}>
              <span aria-hidden="true">📤</span> More apps
            </button>
          )}
          <button type="button" onClick={s.copy} className={`${shareBtn.neutral} ${s.canNative ? "" : "col-span-2"}`}>
            <span aria-hidden="true">🔗</span> Copy link
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">
        Instagram &amp; TikTok: tap <strong>Post to Status / Story</strong>, then add a link sticker with the copied
        link.
      </p>
      <p role="status" aria-live="polite" className="min-h-5 pt-2 text-center text-sm font-bold text-gold">
        {s.toast}
      </p>
    </section>
  );
}
