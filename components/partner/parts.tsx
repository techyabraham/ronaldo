import { PARTNER } from "@/lib/partner";

/* Shared pieces of the SkillsAir banners. No hooks, no server-only imports: RevealOverlay (client) uses them too. */

const c = PARTNER.color;

/** The SkillsAir mark (three bars) + "SkillsAir" wordmark. */
export function PartnerMark({ size }: { size: 14 | 16 | 17 }) {
  return (
    <span className="flex items-center" style={{ gap: size === 14 ? 4 : 5 }}>
      <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true" className="flex-none">
        {[58, 208, 357].map((y, i) => (
          <rect key={y} x="7" y={y} width="498" height="92" rx="30" fill={c.logo[i]} />
        ))}
      </svg>
      <span
        className="font-partner font-bold"
        style={{ fontSize: size, letterSpacing: "-0.01em", lineHeight: 1, color: c.text }}
      >
        Skills<span style={{ color: c.accent }}>Air</span>
      </span>
    </span>
  );
}

/** The "SPONSORED" label; `pill` adds the chip background (home banner and result card). */
export function SponsoredLabel({ pill }: { pill?: boolean }) {
  return (
    <span
      className="flex-none text-[10px] font-extrabold"
      style={{
        letterSpacing: "0.12em",
        color: c.label,
        ...(pill ? { background: c.chip, borderRadius: 5, padding: "3px 6px" } : null),
      }}
    >
      {PARTNER.label}
    </span>
  );
}

/** "Start a <orange>true job-ready tech scholarship</orange> program[ with SkillsAir]" */
export function Headline({ suffix }: { suffix: boolean }) {
  const h = PARTNER.headline;
  return (
    <>
      {h.before}
      <span style={{ color: c.accent }}>{h.highlight}</span>
      {h.after}
      {suffix ? PARTNER.headlineSuffix : ""}
    </>
  );
}

type IconProps = { size: number; stroke: string; width?: number };
const iconBase = (size: number, stroke: string, width: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke,
  strokeWidth: width,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  className: "flex-none",
});

export const ArrowIcon = ({ size, stroke, width = 2.8 }: IconProps) => (
  <svg {...iconBase(size, stroke, width)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const CheckIcon = ({ size, stroke, width = 2.6 }: IconProps) => (
  <svg {...iconBase(size, stroke, width)}>
    <path d="M4 12.5l5 5L20 6.5" />
  </svg>
);
export const MonitorIcon = ({ size, stroke, width = 2.4 }: IconProps) => (
  <svg {...iconBase(size, stroke, width)}>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8M12 16v4" />
  </svg>
);
export const StarIcon = ({ size, stroke, width = 2.4 }: IconProps) => (
  <svg {...iconBase(size, stroke, width)}>
    <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4l-5.2 2.7 1-5.8L3.5 9.2l5.9-.9z" />
  </svg>
);
export const BagIcon = ({ size, stroke, width = 2.4 }: IconProps) => (
  <svg {...iconBase(size, stroke, width)}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M3 13h18" />
  </svg>
);
