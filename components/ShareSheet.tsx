"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { track } from "@/lib/analytics";
import type { SharePayload } from "@/lib/share";
import { useShareSheetRequest } from "@/lib/shareSheet";
import { useShare } from "@/lib/useShare";
import {
  CloseIcon,
  FacebookIcon,
  LinkIcon,
  StoryIcon,
  TelegramIcon,
  ThreadsIcon,
  UploadIcon,
  WhatsAppIcon,
  XIcon,
} from "./icons";

const IDLE: SharePayload = { kind: "invite", url: "/" };

const TITLE: Record<SharePayload["kind"], string> = {
  date: "Share your result",
  goal: "Share this goal",
  invite: "Invite your friends",
};

const tileIcon = "flex h-16 w-16 items-center justify-center rounded-2xl";
const tileCls = "flex min-h-11 flex-col items-center gap-1.5 text-xs font-bold text-text";

function Tile({
  label,
  icon,
  tone = "bg-surface-2 border border-border",
  href,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  tone?: string;
  href?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <span className={`${tileIcon} ${tone}`}>{icon}</span>
      {label}
    </>
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={tileCls}>
      {inner}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={tileCls}>
      {inner}
    </button>
  );
}

/**
 * The page's one share sheet. Opened with openShareSheet() from any button, so a share to X always goes
 * through the X link (with its "Created by" signature) rather than the OS sheet. A native <dialog> gives
 * Esc, focus trapping and the backdrop for free. Bottom sheet on phones, centred dialog from `sm:` up.
 */
export function ShareSheet() {
  const req = useShareSheetRequest();
  const ref = useRef<HTMLDialogElement>(null);
  const s = useShare({
    mmdd: req?.mmdd ?? "home",
    payload: req?.payload ?? IDLE,
    placement: "sheet",
    imagePath: req?.payload.kind === "date" ? req.imagePath : undefined,
  });

  useEffect(() => {
    if (!req) return;
    const d = ref.current;
    if (d && !d.open) d.showModal();
    track({ name: "share_sheet_opened", mmdd: req.mmdd, placement: req.placement });
  }, [req]);

  const close = () => ref.current?.close();
  const kind = req?.payload.kind ?? "invite";

  return (
    <dialog
      ref={ref}
      aria-labelledby="share-sheet-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) close(); // tap on the backdrop
      }}
      className="share-sheet fixed inset-x-0 top-auto bottom-0 m-0 w-full max-w-full rounded-t-[22px] bg-surface p-0 text-text backdrop:bg-black/60 sm:inset-0 sm:m-auto sm:max-w-[420px] sm:rounded-[22px]"
    >
      {/* Nothing inside until first opened: keeps the tile grid out of every page's HTML and hydration. */}
      {req && (
        <div className="px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between">
            <h2 id="share-sheet-title" className="text-lg font-extrabold">
              {TITLE[kind]}
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="flex h-11 w-11 items-center justify-center rounded-full text-muted"
            >
              <CloseIcon />
            </button>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{s.message}</p>

          <div className="mt-4 grid grid-cols-4 gap-x-2 gap-y-4">
            <Tile
              label="WhatsApp"
              href={s.links.whatsapp}
              onClick={() => s.log("whatsapp")}
              tone="bg-green text-green-ink"
              icon={<WhatsAppIcon className="h-7 w-7" />}
            />
            <Tile label="X" href={s.links.x} onClick={() => s.log("x")} icon={<XIcon className="h-6 w-6" />} />
            <Tile
              label="Facebook"
              href={s.links.facebook}
              onClick={() => s.log("facebook")}
              icon={<FacebookIcon className="h-6 w-6" />}
            />
            <Tile
              label="Telegram"
              href={s.links.telegram}
              onClick={() => s.log("telegram")}
              icon={<TelegramIcon className="h-6 w-6" />}
            />
            <Tile
              label="Threads"
              href={s.links.threads}
              onClick={() => s.log("threads")}
              icon={<ThreadsIcon className="h-6 w-6" />}
            />
            {kind === "date" && req?.imagePath && (
              <Tile label="Story" onClick={s.image} tone="bg-red text-white" icon={<StoryIcon className="h-6 w-6" />} />
            )}
            {s.canNative && <Tile label="More apps" onClick={s.native} icon={<UploadIcon className="h-6 w-6" />} />}
            <Tile label="Copy" onClick={s.copy} icon={<LinkIcon className="h-6 w-6" />} />
          </div>

          <p role="status" className="min-h-5 pt-3 text-center text-sm font-bold text-green-text">
            {s.toast}
          </p>
        </div>
      )}
    </dialog>
  );
}
