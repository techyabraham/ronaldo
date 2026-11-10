import type { MetadataRoute } from "next";
import { isProductionDeploy, robotsFor } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return robotsFor(isProductionDeploy(), SITE_URL);
}
