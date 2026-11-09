"use client";
import { useCallback, useId, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useClientValue } from "@/lib/useClientValue";
import { DAYS_IN_MONTH, MONTH_NAMES, formatMmdd, mmdd } from "@/lib/dates";
import { readLast } from "@/lib/storage";
import { track } from "@/lib/analytics";
import { PlayIcon } from "./icons";
import type { RevealData } from "./RevealOverlay";

// Only downloaded when someone actually submits a date.
const RevealOverlay = dynamic(() => import("./RevealOverlay"), { ssr: false });

const chevron =
  "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2214%22 height=%2214%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23A5A5AD%22 stroke-width=%223%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-no-repeat bg-[right_0.9rem_center]";
const selectCls = `h-14 w-full appearance-none rounded-xl border border-border bg-bg pr-9 pl-3.5 font-display text-[26px] uppercase text-text aria-[invalid=true]:border-red-text ${chevron}`;
const labelCls = "text-[11px] font-extrabold tracking-[0.1em] text-muted";

export function BirthdayPicker({ reveal }: { reveal: RevealData }) {
  const router = useRouter();
  const id = useId();
  const [day, setDay] = useState<number | "">("");
  const [month, setMonth] = useState<number | "">("");
  const [error, setError] = useState(false);
  const [revealing, setRevealing] = useState<string | null>(null);
  const last = useClientValue<string | null>(readLast, null);
  const dayRef = useRef<HTMLSelectElement>(null);
  const monthRef = useRef<HTMLSelectElement>(null);

  const ready = day !== "" && month !== "" && day <= DAYS_IN_MONTH[month - 1];

  const go = useCallback((key: string) => router.push(`/birthday/${key}`), [router]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) {
      setError(true);
      (day === "" ? dayRef : monthRef).current?.focus();
      return;
    }
    const key = mmdd(month, day);
    track({ name: "date_searched", mmdd: key });
    router.prefetch(`/birthday/${key}`);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) go(key);
    else setRevealing(key);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" aria-label="Choose your birthday" noValidate>
      <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-2.5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-day`} className={labelCls}>
            DAY
          </label>
          <select
            ref={dayRef}
            id={`${id}-day`}
            className={selectCls}
            value={day}
            aria-invalid={error && day === ""}
            onChange={(e) => {
              setDay(e.target.value ? parseInt(e.target.value, 10) : "");
              setError(false);
            }}
          >
            <option value="">DD</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d} disabled={month !== "" && d > DAYS_IN_MONTH[month - 1]}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-month`} className={labelCls}>
            MONTH
          </label>
          <select
            ref={monthRef}
            id={`${id}-month`}
            className={selectCls}
            value={month}
            aria-invalid={error && month === ""}
            onChange={(e) => {
              setMonth(e.target.value ? parseInt(e.target.value, 10) : "");
              setError(false);
            }}
          >
            <option value="">Month</option>
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1} disabled={day !== "" && day > DAYS_IN_MONTH[i]}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="submit"
        disabled={revealing !== null}
        className="inline-flex h-14 items-center justify-center gap-2.5 rounded-xl bg-red font-display text-[22px] uppercase tracking-[0.03em] text-white transition active:translate-y-0.5"
      >
        <PlayIcon />
        {revealing ? "Rewinding the tape…" : "Play my birthday"}
      </button>
      <p role="alert" className="min-h-0 text-center text-sm font-bold text-red-text empty:hidden">
        {error ? "Pick a day and a month first." : ""}
      </p>
      {last && (
        <p className="text-center text-sm text-muted">
          Last time you checked{" "}
          <Link href={`/birthday/${last}`} className="inline-flex min-h-11 items-center font-bold text-text underline">
            {formatMmdd(last)} — check again
          </Link>
        </p>
      )}
      {revealing && <RevealOverlay mmdd={revealing} data={reveal} onDone={() => go(revealing)} />}
    </form>
  );
}
