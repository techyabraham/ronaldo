"use client";
import { useCallback, useState } from "react";
import { track, type ShareChannel } from "./analytics";
import { shareLinks } from "./share";
import { useClientValue } from "./useClientValue";

const hasNativeShare = () => typeof navigator.share === "function";

export type ShareConfig = {
  mmdd: string;
  url: string;
  text: string;
  /** Where on the page the button lives, for analytics ("panel", "sticky", "nudge", "home"). */
  placement: string;
  /** Square PNG to share to Status / Stories; omitted on the home page. */
  imagePath?: string;
};

async function copyToClipboard(s: string) {
  try {
    await navigator.clipboard.writeText(s);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = s;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

function download(path: string, filename: string) {
  const a = document.createElement("a");
  a.href = path;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** All share actions in one place, so every share surface behaves the same and is tracked the same. */
export function useShare(cfg: ShareConfig) {
  const canNative = useClientValue(hasNativeShare, false);
  const [toast, setToast] = useState<string | null>(null);
  const links = shareLinks(cfg.text, cfg.url);
  const full = `${cfg.text} ${cfg.url}`;

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const log = useCallback(
    (channel: ShareChannel) => track({ name: "share_tapped", mmdd: cfg.mmdd, channel, placement: cfg.placement }),
    [cfg.mmdd, cfg.placement],
  );

  /** OS share sheet with text + link (WhatsApp, Instagram DMs, SMS, anything installed). */
  const native = useCallback(async () => {
    log("native");
    if (!hasNativeShare()) {
      await copyToClipboard(full);
      flash("Link copied! Paste it in your chats");
      return;
    }
    try {
      await navigator.share({ text: cfg.text, url: cfg.url });
    } catch {
      /* cancelled */
    }
  }, [cfg.text, cfg.url, full, flash, log]);

  /**
   * Share the actual result image (for WhatsApp Status, Instagram/TikTok/Snapchat Stories).
   * Uses the Web Share API with files where supported; otherwise saves the PNG and copies the link.
   */
  const filename = `goat-day-${cfg.mmdd}.png`;

  /** Try to hand the PNG to the OS share sheet. Returns "shared", "cancelled" or "unsupported". */
  const shareFile = useCallback(async (): Promise<"shared" | "cancelled" | "unsupported"> => {
    if (!cfg.imagePath || typeof navigator.canShare !== "function") return "unsupported";
    try {
      const blob = await (await fetch(cfg.imagePath)).blob();
      const file = new File([blob], filename, { type: "image/png" });
      if (!navigator.canShare({ files: [file] })) return "unsupported";
      log("image");
      await navigator.share({ files: [file], text: full });
      return "shared";
    } catch (e) {
      return (e as Error).name === "AbortError" ? "cancelled" : "unsupported";
    }
  }, [cfg.imagePath, filename, full, log]);

  const image = useCallback(async () => {
    if (!cfg.imagePath) return;
    if ((await shareFile()) !== "unsupported") return;
    log("save-image");
    download(cfg.imagePath, filename);
    await copyToClipboard(full);
    flash("Image saved & link copied. Post it to your Status or Story");
  }, [cfg.imagePath, filename, full, flash, log, shareFile]);

  /**
   * The one big "Post my GOAT Day" action: the Story image where the phone can share files,
   * otherwise the OS share sheet with text + link, otherwise (desktop) jump to the full share panel.
   */
  const post = useCallback(async () => {
    if ((await shareFile()) !== "unsupported") return;
    if (hasNativeShare()) return native();
    log("native");
    const panel = document.getElementById("share");
    panel?.scrollIntoView({ behavior: "smooth", block: "start" });
    panel?.querySelector<HTMLElement>("a,button")?.focus({ preventScroll: true });
  }, [shareFile, native, log]);

  const copy = useCallback(async () => {
    log("copy");
    await copyToClipboard(full);
    flash("Link copied! Paste it anywhere");
  }, [full, flash, log]);

  return { canNative, links, native, image, post, copy, log, toast };
}
