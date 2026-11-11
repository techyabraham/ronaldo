"use client";
import type { CSSProperties, ReactNode } from "react";
import { track } from "@/lib/analytics";
import { PARTNER, type PartnerPlacement, partnerHref } from "@/lib/partner";

/**
 * The single <a> that wraps a whole sponsor banner. The only client JS of the banners: one click event.
 * Colours, radius and decoration are inline so host styles (e.g. the about page's `[&_a]` rules,
 * the 404's centred text) can't leak in, and so the global focus ring follows the banner's own radius.
 */
export function PartnerLink({
  placement,
  slot,
  label,
  radius,
  className,
  style,
  children,
}: {
  placement: PartnerPlacement;
  slot?: number;
  label: string;
  radius: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <a
      href={partnerHref(placement, slot)}
      target="_blank"
      rel="sponsored noopener"
      aria-label={label}
      data-nosnippet=""
      data-partner={placement}
      onClick={() => track({ name: "partner_click", placement })}
      className={`box-border w-full ${className ?? ""}`}
      style={{
        background: PARTNER.color.bg,
        border: `1px solid ${PARTNER.color.border}`,
        borderRadius: radius,
        color: PARTNER.color.text,
        textDecoration: "none",
        textAlign: "left",
        lineHeight: "normal",
        ...style,
      }}
    >
      {children}
    </a>
  );
}
