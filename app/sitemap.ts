import type { MetadataRoute } from "next";
import { ALL_MMDD } from "@/lib/dates";
import { DATA_UPDATED } from "@/lib/goals";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(DATA_UPDATED);
  return [
    { url: `${SITE_URL}/`, lastModified, priority: 1 },
    { url: `${SITE_URL}/about`, lastModified, priority: 0.3 },
    ...ALL_MMDD.map((mmdd) => ({ url: `${SITE_URL}/birthday/${mmdd}`, lastModified, priority: 0.7 })),
  ];
}
