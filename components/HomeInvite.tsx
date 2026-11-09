"use client";
import { INVITE_TEXT } from "@/lib/share";
import { useShare } from "@/lib/useShare";
import { WhatsAppIcon, shareBtn } from "./shareStyles";

/** Home-page invite: get the group chat playing before anyone has a result. */
export function HomeInvite({ url }: { url: string }) {
  const s = useShare({ mmdd: "home", url, text: INVITE_TEXT, placement: "home" });
  return (
    <section aria-labelledby="invite-h" className="rounded-3xl border border-border bg-surface p-4">
      <h2 id="invite-h" className="text-xl font-black">
        Play it with your group chat 👥
      </h2>
      <p className="mt-1 text-sm text-muted">Everyone checks their birthday. Most Ronaldo goals wins.</p>
      <div className="mt-3 flex gap-2">
        <a
          href={s.links.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => s.log("invite")}
          className={`${shareBtn.whatsapp} flex-1`}
        >
          <WhatsAppIcon /> Send to group
        </a>
        <button type="button" onClick={s.canNative ? s.native : s.copy} className={`${shareBtn.neutral} flex-1`}>
          <span aria-hidden="true">{s.canNative ? "📤" : "🔗"}</span> {s.canNative ? "Share" : "Copy link"}
        </button>
      </div>
      {s.toast && (
        <p role="status" className="pt-2 text-center text-sm font-bold text-gold">
          {s.toast}
        </p>
      )}
    </section>
  );
}
