import Link from "next/link";
import { formatLongDate } from "@/lib/dates";
import { DATA_UPDATED } from "@/lib/goals";

/** "How we count / last checked" line at the end of result pages and month hubs. Server component. */
export function TrustLine({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-faint ${className}`}>
      Data: official senior goals only. Last checked {formatLongDate(DATA_UPDATED)}.{" "}
      <Link href="/about#what-counts" className="font-bold text-muted underline">
        How we count →
      </Link>
    </p>
  );
}
