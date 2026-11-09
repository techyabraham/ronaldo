/** Inline stroke icons. Always aria-hidden: the control that wraps them carries the accessible name. */
type P = { className?: string };
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  viewBox: "0 0 24 24",
};

export const CROWN_PATH = "M3 18h18l-1.5-10-4.5 4-3-6-3 6-4.5-4z";

export function CrownIcon({ className = "h-5 w-5", filled = true }: P & { filled?: boolean }) {
  return filled ? (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d={CROWN_PATH} />
    </svg>
  ) : (
    <svg {...stroke} className={className}>
      <path d={CROWN_PATH} />
    </svg>
  );
}

export function PlayIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M7 4v16l13-8z" />
    </svg>
  );
}

export function SearchIcon({ className = "h-[22px] w-[22px]" }: P) {
  return (
    <svg {...stroke} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </svg>
  );
}

export function BackIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg {...stroke} className={className}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function HomeIcon({ className = "h-[22px] w-[22px]" }: P) {
  return (
    <svg {...stroke} className={className}>
      <path d="M3 11l9-7 9 7v9H3z" />
    </svg>
  );
}

export function CalendarIcon({ className = "h-[22px] w-[22px]" }: P) {
  return (
    <svg {...stroke} className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function ShareIcon({ className = "h-[22px] w-[22px]" }: P) {
  return (
    <svg {...stroke} className={className}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}

export function InfoIcon({ className = "h-[22px] w-[22px]" }: P) {
  return (
    <svg {...stroke} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5v.01" />
    </svg>
  );
}

export function LinkIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg {...stroke} className={className}>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </svg>
  );
}

/** Phone with a story ring: "post to Status / Story". */
export function StoryIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg {...stroke} className={className}>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <circle cx="12" cy="11" r="3.2" />
      <path d="M10.5 18h3" />
    </svg>
  );
}

export function UploadIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg {...stroke} className={className}>
      <path d="M12 15V3M7 8l5-5 5 5" />
      <path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
    </svg>
  );
}

export function CheckIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg {...stroke} className={className}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

/** Empty goal frame with a net, for the 404 page. */
export function GoalFrameIcon({ className = "h-16 w-16" }: P) {
  return (
    <svg {...stroke} viewBox="0 0 48 32" className={className} strokeWidth={2}>
      <path d="M4 30V4h40v26" />
      <path d="M4 4l6 6h28l6-6M10 10v20M38 10v20M10 17h28M10 24h28M17 10v20M24 10v20M31 10v20" strokeWidth={1} />
    </svg>
  );
}

export function WhatsAppIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.7-.3-1.4-.7-2-1.3-.5-.5-1-1.1-1.3-1.7-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.6.6-.9 1.4-.9 2.2 0 .9.4 1.8 1 2.6 1 1.5 2.4 2.7 4 3.4.9.4 1.7.6 2.5.5.7-.1 1.4-.6 1.7-1.2.2-.4.2-.9.1-1.1l-.6-.4z" />
    </svg>
  );
}
