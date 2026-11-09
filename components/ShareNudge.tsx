"use client";
import { useShare } from "@/lib/useShare";
import { LinkIcon, UploadIcon, WhatsAppIcon } from "./icons";
import { shareBtn } from "./shareStyles";

/** Compact in-flow reminder to share, shown between/after the goal cards. */
export function ShareNudge({
  mmdd,
  url,
  text,
  title,
  placement,
}: {
  mmdd: string;
  url: string;
  text: string;
  title: string;
  placement: string;
}) {
  const s = useShare({ mmdd, url, text, placement });
  return (
    <aside className="rounded-[18px] border border-dashed border-red bg-surface p-4" aria-label="Share">
      <p className="font-extrabold leading-snug">{title}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={s.links.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => s.log("whatsapp")}
          className={shareBtn.whatsapp}
        >
          <WhatsAppIcon /> WhatsApp
        </a>
        <button type="button" onClick={s.canNative ? s.native : s.copy} className={shareBtn.neutral}>
          {s.canNative ? <UploadIcon /> : <LinkIcon />} {s.canNative ? "Share" : "Copy link"}
        </button>
      </div>
      {s.toast && (
        <p role="status" className="pt-2 text-center text-sm font-bold text-green-text">
          {s.toast}
        </p>
      )}
    </aside>
  );
}
