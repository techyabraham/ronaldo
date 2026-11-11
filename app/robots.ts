import type { MetadataRoute } from "next";
import { isProductionDeploy, robotsFor } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { videoPages } from "@/lib/videoSitemap";

export default function robots(): MetadataRoute.Robots {
  return robotsFor(isProductionDeploy(), SITE_URL, videoPages().length > 0);
}
