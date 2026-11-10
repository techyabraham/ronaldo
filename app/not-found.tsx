import type { Metadata } from "next";
import Link from "next/link";
import { GoalFrameIcon } from "@/components/icons";

// Next already answers 404 and injects noindex here; this makes both explicit and gives the tab a title.
export const metadata: Metadata = { title: "Page not found", robots: { index: false, follow: true } };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 pt-14 text-center">
      <GoalFrameIcon className="mx-auto h-20 w-28 text-faint" />
      <h1 className="mt-5 font-display text-5xl uppercase">Off target</h1>
      <p className="mt-2 text-muted">That page doesn&apos;t exist. Try picking a date instead.</p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-14 items-center rounded-xl bg-red px-6 font-display text-xl uppercase tracking-wide text-white"
      >
        Check a birthday
      </Link>
    </div>
  );
}
