"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import type { SharePayload } from "@/lib/share";
import { openShareSheet } from "@/lib/shareSheet";
import { CalendarIcon, HomeIcon, InfoIcon, ShareIcon } from "./icons";
import { ShareSheet } from "./ShareSheet";

const tab =
  "flex min-h-11 flex-col items-center justify-center gap-1 text-[11px] font-bold text-faint aria-[current=page]:text-text";

/**
 * Bottom tab bar for the browse pages (/, /calendar, /about). Result pages use the sticky ShareBar instead.
 * It also mounts the browse pages' one ShareSheet, which its Share tab and the home invite open.
 */
export function TabBar({ url }: { url: string }) {
  const path = usePathname();
  const payload = useMemo<SharePayload>(() => ({ kind: "invite", url }), [url]);
  const current = (href: string) => (path === href ? ("page" as const) : undefined);
  return (
    <>
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
          <button
            type="button"
            className={tab}
            onClick={() => openShareSheet({ mmdd: "home", payload, placement: "tabbar" })}
          >
            <ShareIcon />
            Share
          </button>
          <Link href="/about" className={tab} aria-current={current("/about")}>
            <InfoIcon />
            About
          </Link>
        </div>
      </nav>
      <ShareSheet />
    </>
  );
}
