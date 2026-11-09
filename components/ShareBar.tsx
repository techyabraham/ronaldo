"use client";
import { useEffect, useState } from "react";
import { shareLinks, shareText } from "@/lib/share";
import { writeLast } from "@/lib/storage";
import { track } from "@/lib/analytics";
import { useClientValue } from "@/lib/useClientValue";

const hasNativeShare = () => typeof navigator.share === "function";

const base =
  "flex-1 min-h-12 min-w-12 inline-flex items-center justify-center gap-1.5 rounded-xl border font-bold text-sm";
const btn = `${base} border-border bg-surface-2 text-text`;

export function ShareBar({ mmdd, count, url }: { mmdd: string; count: number; url: string }) {
  const canShare = useClientValue(hasNativeShare, false);
  const [copied, setCopied] = useState(false);
  const text = shareText(count);
  const links = shareLinks(text, url);

  // Remember this date for the "check again" link on the home page.
  useEffect(() => writeLast(mmdd), [mmdd]);

  const native = async () => {
    track({ name: "share_tapped", mmdd, channel: "native" });
    try {
      await navigator.share({ text, url });
    } catch {
      /* user cancelled */
    }
  };
  const copy = async () => {
    track({ name: "share_tapped", mmdd, channel: "copy" });
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = `${text} ${url}`;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg pb-[env(safe-area-inset-bottom)]"
      role="region"
      aria-label="Share your result"
    >
      <div className="mx-auto max-w-xl px-3 py-2">
        <p className="sr-only" data-testid="share-text">
          {text} {url}
        </p>
        <div className="flex gap-2">
          {canShare && (
            <button type="button" onClick={native} className={`${base} border-gold bg-gold text-gold-ink flex-[2]`}>
              <span aria-hidden="true">📤</span> Share
            </button>
          )}
          <a
            href={links.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={btn}
            onClick={() => track({ name: "share_tapped", mmdd, channel: "whatsapp" })}
          >
            <span className="sr-only">Share on </span>WhatsApp
          </a>
          <a
            href={links.x}
            target="_blank"
            rel="noopener noreferrer"
            className={btn}
            onClick={() => track({ name: "share_tapped", mmdd, channel: "x" })}
          >
            <span aria-hidden="true">𝕏</span>
            <span className="sr-only">Share on X</span>
          </a>
          <a
            href={links.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className={btn}
            onClick={() => track({ name: "share_tapped", mmdd, channel: "facebook" })}
          >
            <span aria-hidden="true">f</span>
            <span className="sr-only">Share on Facebook</span>
          </a>
          <button type="button" onClick={copy} className={btn}>
            <span aria-hidden="true">{copied ? "✓" : "🔗"}</span>
            <span className="sr-only" aria-live="polite">
              {copied ? "Link copied" : "Copy link"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
