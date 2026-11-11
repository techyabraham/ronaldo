import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { PartnerBanner } from "@/components/partner/PartnerBanner";
import { PartnerCard } from "@/components/partner/PartnerCard";
import { PartnerStrip } from "@/components/partner/PartnerStrip";

// Dev-only (*.dev.tsx is routed only under `next dev`): the three SkillsAir banners at the column widths of
// 320 / 360 / 448 px viewports (viewport minus the 16px gutters), next to the approved design when
// design-reference/skillsair-banners-reference.html (git-ignored) is present.
export const metadata: Metadata = { title: "Partner preview", robots: { index: false, follow: false } };

const WIDTHS = [
  { w: 288, vp: 320 },
  { w: 328, vp: 360 },
  { w: 416, vp: 448 },
];

function referenceBanners(): string[] {
  try {
    const html = fs.readFileSync(path.join(process.cwd(), "design-reference/skillsair-banners-reference.html"), "utf8");
    return [...html.matchAll(/<a href="https:\/\/skillsair[\s\S]*?<\/a>/g)].map((m) => m[0]);
  } catch {
    return [];
  }
}

export default function PartnerPreview() {
  const refs = referenceBanners();
  return (
    <div className="flex flex-col gap-10 px-4 py-6">
      {(
        [
          ["1 · Home banner", PartnerBanner],
          ["2 · Loading-screen strip", PartnerStrip],
          ["3 · Result-page card", PartnerCard],
        ] as const
      ).map(([title, C], i) => (
        <section key={title}>
          <h2 className="mb-3 text-sm font-bold text-muted">{title}</h2>
          <div className="flex flex-wrap items-start gap-6">
            {WIDTHS.map(({ w, vp }) => (
              <div key={w} style={{ width: w }} data-preview-width={w}>
                <p className="mb-1.5 text-xs text-faint">
                  {w}px (viewport {vp})
                </p>
                <C placement="home" />
              </div>
            ))}
            {refs[i] && (
              <div data-preview-reference>
                <p className="mb-1.5 text-xs text-faint">Reference (fixed size)</p>
                <div dangerouslySetInnerHTML={{ __html: refs[i] }} />
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
