import { PARTNER, type PartnerPlacement, partnerAriaLabel } from "@/lib/partner";
import { PartnerLink } from "./PartnerLink";
import { ArrowIcon, CheckIcon, Headline, PartnerMark, SponsoredLabel } from "./parts";

const c = PARTNER.color;

/** "1 · Home banner" (designed at 416×148). Fluid width; grows if text wraps. Server component. */
export function PartnerBanner({ placement, slot }: { placement: PartnerPlacement; slot?: number }) {
  return (
    <PartnerLink
      placement={placement}
      slot={slot}
      label={partnerAriaLabel("banner")}
      radius={20}
      className="@container flex min-h-[148px] flex-col justify-between gap-2.5 px-4 py-3.5"
    >
      <span className="flex items-center justify-between gap-2.5">
        <PartnerMark size={16} />
        <SponsoredLabel pill />
      </span>
      <span
        className="block font-partner text-[19px] font-bold"
        style={{ lineHeight: 1.15, letterSpacing: "-0.015em" }}
      >
        <Headline suffix />
      </span>
      {/* Under 360px of banner width the CTA pill drops under the benefit line. */}
      <span className="flex items-center justify-between gap-2.5 @max-[359px]:flex-col @max-[359px]:items-start">
        <span className="flex min-w-0 items-center gap-1.5 text-[13px] font-bold" style={{ color: c.body }}>
          <CheckIcon size={16} stroke={c.check} />
          <span className="min-w-0">{PARTNER.benefit}</span>
        </span>
        <span
          className="flex h-[34px] flex-none items-center gap-1 rounded-full px-3.5 text-[13px] font-extrabold whitespace-nowrap"
          style={{ background: c.accent, color: c.onAccent }}
        >
          {PARTNER.cta}
          <ArrowIcon size={14} stroke={c.onAccent} />
        </span>
      </span>
    </PartnerLink>
  );
}
