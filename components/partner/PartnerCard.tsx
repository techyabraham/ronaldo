import { PARTNER, type PartnerPlacement, partnerAriaLabel } from "@/lib/partner";
import { PartnerLink } from "./PartnerLink";
import { ArrowIcon, BagIcon, Headline, MonitorIcon, PartnerMark, SponsoredLabel, StarIcon } from "./parts";

const c = PARTNER.color;

const BENEFITS = [
  { Icon: MonitorIcon, stroke: c.check, text: "Job-ready tech skills" },
  { Icon: StarIcon, stroke: c.star, text: "True scholarship" },
  { Icon: BagIcon, stroke: c.bag, text: PARTNER.benefit },
] as const;

/** "3 · Result-page card" (designed at 416×236). Fluid width; grows if text wraps. Server component. */
export function PartnerCard({ placement, slot }: { placement: PartnerPlacement; slot?: number }) {
  return (
    <PartnerLink
      placement={placement}
      slot={slot}
      label={partnerAriaLabel("card")}
      radius={18}
      // gap-1 is a floor: at the 416px design width space-between spreads the rows to the reference's 236px.
      className="flex min-h-[236px] flex-col justify-between gap-1 p-4"
    >
      <span className="flex items-center justify-between gap-2.5">
        <PartnerMark size={17} />
        <SponsoredLabel pill />
      </span>
      <span
        className="block font-partner text-[21px] font-bold"
        style={{ lineHeight: 1.14, letterSpacing: "-0.015em" }}
      >
        <Headline suffix />
      </span>
      <span className="grid grid-cols-3 gap-1.5">
        {BENEFITS.map(({ Icon, stroke, text }) => (
          <span
            key={text}
            className="flex min-w-0 flex-col gap-1 rounded-[10px] p-2 text-xs font-bold"
            style={{ background: c.chip, color: c.soft, lineHeight: 1.2 }}
          >
            <Icon size={16} stroke={stroke} />
            {text}
          </span>
        ))}
      </span>
      <span
        className="flex h-11 items-center justify-center gap-1.5 rounded-xl text-[15px] font-extrabold"
        style={{ background: c.accent, color: c.onAccent }}
      >
        {PARTNER.cta}
        <ArrowIcon size={16} stroke={c.onAccent} />
      </span>
    </PartnerLink>
  );
}
