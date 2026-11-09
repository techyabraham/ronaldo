"use client";
import { useId, useState } from "react";
import { useClientValue } from "@/lib/useClientValue";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DAYS_IN_MONTH, MONTH_NAMES, formatMmdd, mmdd } from "@/lib/dates";
import { readLast } from "@/lib/storage";
import { track } from "@/lib/analytics";

const selectCls =
  "w-full min-h-14 rounded-2xl border-2 border-border bg-surface px-4 text-lg font-bold text-text appearance-none " +
  "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2214%22 height=%2214%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23a9b0aa%22 stroke-width=%223%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-no-repeat bg-[right_1rem_center]";

export function BirthdayPicker({ initial }: { initial?: string }) {
  const router = useRouter();
  const id = useId();
  const [day, setDay] = useState<number | "">(initial ? parseInt(initial.slice(3), 10) : "");
  const [month, setMonth] = useState<number | "">(initial ? parseInt(initial.slice(0, 2), 10) : "");
  const last = useClientValue<string | null>(readLast, null);
  const [pending, setPending] = useState(false);

  const ready = day !== "" && month !== "" && day <= DAYS_IN_MONTH[month - 1];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    const key = mmdd(month, day);
    track({ name: "date_searched", mmdd: key });
    setPending(true);
    router.push(`/birthday/${key}`);
  };

  return (
    <form onSubmit={submit} className="w-full" aria-label="Choose your birthday">
      <div className="grid grid-cols-[1fr_1.6fr] gap-3">
        <div>
          <label htmlFor={`${id}-day`} className="block text-sm font-bold text-muted mb-1">
            Day
          </label>
          <select
            id={`${id}-day`}
            className={selectCls}
            value={day}
            onChange={(e) => setDay(e.target.value ? parseInt(e.target.value, 10) : "")}
            required
          >
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d} disabled={month !== "" && d > DAYS_IN_MONTH[month - 1]}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-month`} className="block text-sm font-bold text-muted mb-1">
            Month
          </label>
          <select
            id={`${id}-month`}
            className={selectCls}
            value={month}
            onChange={(e) => setMonth(e.target.value ? parseInt(e.target.value, 10) : "")}
            required
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
        disabled={!ready || pending}
        className="mt-4 w-full min-h-14 rounded-2xl bg-gold text-gold-ink text-xl font-black uppercase tracking-tight shadow-[0_6px_0_0_rgba(0,0,0,0.35)] active:translate-y-0.5 disabled:opacity-50 transition"
      >
        {pending ? "Checking…" : "Check my birthday"}
      </button>
      {last && (
        <p className="mt-3 text-center text-sm text-muted">
          Last time you checked{" "}
          <Link href={`/birthday/${last}`} className="font-bold text-text underline min-h-11 inline-flex items-center">
            {formatMmdd(last)} — check again
          </Link>
        </p>
      )}
    </form>
  );
}
