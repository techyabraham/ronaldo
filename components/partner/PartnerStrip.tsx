import { PARTNER, type PartnerPlacement, partnerAriaLabel } from "@/lib/partner";
import { PartnerLink } from "./PartnerLink";
import { ArrowIcon, Headline, PartnerMark, SponsoredLabel } from "./parts";

const c = PARTNER.color;

/** "2 · Loading-screen strip" (designed at 408×100). Fluid width; grows if text wraps. No hooks. */
export function PartnerStrip({ placement, slot }: { placement: PartnerPlacement; slot?: number }) {
  return (
    <PartnerLink
      placement={placement}
      slot={slot}
      label={partnerAriaLabel("strip")}
      radius={16}
      className="flex min-h-[100px] items-center gap-3 py-3 pr-3 pl-3.5"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
        <span className="flex items-center gap-2">
          <PartnerMark size={14} />
          <SponsoredLabel />
        </span>
        <span className="font-partner text-[15px] font-bold" style={{ lineHeight: 1.2, letterSpacing: "-0.01em" }}>
          <Headline suffix={false} />
        </span>
        <span className="text-xs font-semibold" style={{ color: c.body, lineHeight: 1.2 }}>
          Get {PARTNER.benefit.charAt(0).toLowerCase() + PARTNER.benefit.slice(1)}
        </span>
      </span>
      <span
        className="flex h-11 w-11 flex-none items-center justify-center rounded-full"
        style={{ background: c.accent }}
      >
        <ArrowIcon size={18} stroke={c.onAccent} />
      </span>
    </PartnerLink>
  );
}
