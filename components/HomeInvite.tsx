"use client";
import { useMemo } from "react";
import type { SharePayload } from "@/lib/share";
import { openShareSheet } from "@/lib/shareSheet";
import { useShare } from "@/lib/useShare";
import { ShareIcon, WhatsAppIcon } from "./icons";
import { shareBtn } from "./shareStyles";

/** Home-page invite: get the group chat playing before anyone has a result. */
export function HomeInvite({ url }: { url: string }) {
  const payload = useMemo<SharePayload>(() => ({ kind: "invite", url }), [url]);
  const s = useShare({ mmdd: "home", payload, placement: "home" });
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
          onClick={() => openShareSheet({ mmdd: "home", payload, placement: "home" })}
          className={`${shareBtn.neutral} min-h-14 whitespace-nowrap px-3`}
        >
          <ShareIcon className="h-5 w-5" /> Share
        </button>
      </div>
    </section>
  );
}
