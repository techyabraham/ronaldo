/** The signature motif: a 2:3 green/red split bar. Decorative only. */
export function FlagBar({ height = 5, className = "" }: { height?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={`flex overflow-hidden rounded-full ${className}`} style={{ height }}>
      <div className="flex-[2] bg-green" />
      <div className="flex-[3] bg-red" />
    </div>
  );
}
