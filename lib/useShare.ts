"use client";
import { useCallback, useMemo, useState } from "react";
import { track, type ShareChannel, type SharePlacement } from "./analytics";
import { buildShare, type SharePayload } from "./share";
import { CREDIT_LINK } from "./site";
import { useClientValue } from "./useClientValue";

const hasNativeShare = () => typeof navigator.share === "function";

export type ShareConfig = {
  /** Date key for analytics ("06-23"), or "home" for the invite. */
  mmdd: string;
  payload: SharePayload;
  /** Where on the page the button lives, for analytics. */
  placement: SharePlacement;
  /** Story PNG to share to Status / Stories; omitted for invites and single goals. */
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

/**
 * All share actions in one place, so every surface says the same thing (via buildShare), carries the
 * creator credit, and is tracked the same way.
 */
export function useShare(cfg: ShareConfig) {
  const canNative = useClientValue(hasNativeShare, false);
  const [toast, setToast] = useState<string | null>(null);
  const built = useMemo(() => buildShare(cfg.payload), [cfg.payload]);
  const { links, plain, message } = built;
  const url = cfg.payload.url;

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const log = useCallback(
    (channel: ShareChannel) => track({ name: "share_tapped", mmdd: cfg.mmdd, channel, placement: cfg.placement }),
    [cfg.mmdd, cfg.placement],
  );

  /** OS share sheet with the non-X message + credit and the link (WhatsApp, Instagram DMs, SMS, …). */
  const native = useCallback(async () => {
    log("native");
    if (!hasNativeShare()) {
      await copyToClipboard(plain);
      flash("Copied. Paste it anywhere");
      return;
    }
    try {
      await navigator.share({ text: `${message}\n\n${CREDIT_LINK}`, url });
    } catch {
      /* cancelled */
    }
  }, [message, url, plain, flash, log]);

  const filename = `goat-day-${cfg.mmdd}.png`;

  /** Try to hand the PNG to the OS share sheet. Returns "shared", "cancelled" or "unsupported". */
  const shareFile = useCallback(async (): Promise<"shared" | "cancelled" | "unsupported"> => {
    if (!cfg.imagePath || typeof navigator.canShare !== "function") return "unsupported";
    try {
      const blob = await (await fetch(cfg.imagePath)).blob();
      const file = new File([blob], filename, { type: "image/png" });
      if (!navigator.canShare({ files: [file] })) return "unsupported";
      log("image");
      await navigator.share({ files: [file], text: plain });
      return "shared";
    } catch (e) {
      return (e as Error).name === "AbortError" ? "cancelled" : "unsupported";
    }
  }, [cfg.imagePath, filename, plain, log]);

  /**
   * Share the Story image (WhatsApp Status, Instagram/TikTok/Snapchat Stories) with the plain message as
   * caption; where files can't be shared, save the PNG and copy the message.
   */
  const image = useCallback(async () => {
    if (!cfg.imagePath) return;
    if ((await shareFile()) !== "unsupported") return;
    log("save-image");
    download(cfg.imagePath, filename);
    await copyToClipboard(plain);
    flash("Image saved & message copied. Post it to your Status or Story");
  }, [cfg.imagePath, filename, plain, flash, log, shareFile]);

  const copy = useCallback(async () => {
    log("copy");
    await copyToClipboard(plain);
    flash("Copied. Paste it anywhere");
  }, [plain, flash, log]);

  return { canNative, links, plain, message, native, image, copy, log, toast };
}
