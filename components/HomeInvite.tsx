"use client";
import { INVITE_TEXT } from "@/lib/share";
import { useShare } from "@/lib/useShare";
import { LinkIcon, UploadIcon, WhatsAppIcon } from "./icons";
import { shareBtn } from "./shareStyles";

/** Home-page invite: get the group chat playing before anyone has a result. */
export function HomeInvite({ url }: { url: string }) {
  const s = useShare({ mmdd: "home", url, text: INVITE_TEXT, placement: "home" });
  return (
    <section aria-labelledby="invite-h" className="rounded-[20px] bg-surface p-4">
      <h2 id="invite-h" className="text-lg font-extrabold">
        Run it in the group chat
      </h2>
      <p className="mt-1 text-sm text-muted">Everyone checks their birthday. Most GOAT goals wins.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={s.links.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => s.log("invite")}
          className={`${shareBtn.whatsapp} min-h-14 whitespace-nowrap px-3`}
        >
          <WhatsAppIcon /> Send to group
        </a>
        <button
          type="button"
          onClick={s.canNative ? s.native : s.copy}
          className={`${shareBtn.neutral} min-h-14 whitespace-nowrap px-3`}
        >
          {s.canNative ? <UploadIcon /> : <LinkIcon />} {s.canNative ? "Share" : "Copy link"}
        </button>
      </div>
      {s.toast && (
        <p role="status" className="pt-2 text-center text-sm font-bold text-green-text">
          {s.toast}
        </p>
      )}
    </section>
  );
}
