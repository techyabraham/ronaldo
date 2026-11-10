"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShare } from "@/lib/useShare";
import { CalendarIcon, HomeIcon, InfoIcon, ShareIcon } from "./icons";

const tab =
  "flex min-h-11 flex-col items-center justify-center gap-1 text-[11px] font-bold text-faint aria-[current=page]:text-text";

/** Bottom tab bar for the browse pages (/, /calendar, /about). Result pages use the sticky ShareBar instead. */
export function TabBar({ url }: { url: string }) {
  const path = usePathname();
  const s = useShare({ mmdd: "home", payload: { kind: "invite", url }, placement: "tabbar" });
  const current = (href: string) => (path === href ? ("page" as const) : undefined);
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-bg pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto grid h-[76px] max-w-md grid-cols-4 pb-2.5">
        <Link href="/" className={tab} aria-current={current("/")}>
          <HomeIcon />
          Home
        </Link>
        <Link href="/calendar" className={tab} aria-current={current("/calendar")}>
          <CalendarIcon />
          Calendar
        </Link>
        <button type="button" className={tab} onClick={s.canNative ? s.native : s.copy}>
          <ShareIcon />
          Share
        </button>
        <Link href="/about" className={tab} aria-current={current("/about")}>
          <InfoIcon />
          About
        </Link>
      </div>
      {s.toast && (
        <p
          role="status"
          className="absolute inset-x-0 -top-10 mx-auto w-fit rounded-full bg-surface-2 px-4 py-2 text-sm font-bold"
        >
          {s.toast}
        </p>
      )}
    </nav>
  );
}
