import { calendarRows, scoringDayCount } from "@/lib/goals";
import { formatMmdd } from "@/lib/dates";

/**
 * The whole year at a glance: 12 rows × 31 days. Server component, zero client JS.
 * Read by screen readers as a single image with a summary label; cells are not focusable.
 */
export function GoalCalendar({ highlight, legend = false }: { highlight?: string; legend?: boolean }) {
  const rows = calendarRows();
  const scored = scoringDayCount();
  const hl = highlight ? rows.flatMap((r) => r.cells).find((c) => c.mmdd === highlight) : undefined;
  const label =
    `Goal calendar: Ronaldo has scored on ${scored} of 366 dates.` +
    (hl
      ? hl.state === "hit"
        ? ` ${formatMmdd(hl.mmdd)} is one of them.`
        : ` ${formatMmdd(hl.mmdd)} is one of the ${366 - scored} he hasn't.`
      : "");

  return (
    <div>
      <div
        role="img"
        aria-label={label}
        className="grid gap-[2px]"
        style={{ gridTemplateColumns: "14px repeat(31, minmax(0, 1fr))" }}
      >
        {rows.map((r) => (
          <Row key={r.month} initial={r.initial} cells={r.cells} highlight={highlight} />
        ))}
      </div>
      {legend && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Legend">
          <li className="inline-flex items-center gap-1.5">
            <span className="h-[9px] w-[9px] rounded-[2px] bg-green" aria-hidden="true" />
            GOAT scored
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="h-[9px] w-[9px] rounded-[2px] bg-cell-empty" aria-hidden="true" />
            Rest day
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span
              className={`h-[8px] w-[8px] rounded-[2px] ${hl?.state === "miss" ? "bg-bg outline-white" : "bg-white outline-red"} outline-2`}
              aria-hidden="true"
            />
            You
          </li>
        </ul>
      )}
    </div>
  );
}

function Row({
  initial,
  cells,
  highlight,
}: {
  initial: string;
  cells: ReturnType<typeof calendarRows>[number]["cells"];
  highlight?: string;
}) {
  return (
    <>
      <span className="self-center text-[10px] font-bold leading-none text-faint">{initial}</span>
      {cells.map((c) => {
        const you = c.mmdd === highlight && c.state !== "void";
        const cls =
          c.state === "void"
            ? ""
            : you
              ? c.state === "hit"
                ? "relative z-10 bg-white outline-2 outline-red"
                : "relative z-10 bg-bg outline-2 outline-white"
              : c.state === "hit"
                ? "bg-green"
                : "bg-cell-empty";
        return <span key={c.mmdd} className={`aspect-square rounded-[2px] ${cls}`} />;
      })}
    </>
  );
}
