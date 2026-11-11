import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Lets the sponsor off-switch e2e build (playwright.partner-off.config.ts) live beside the normal .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // *.dev.tsx / *.dev.ts routes (the video review tool) only exist under `next dev`, never in production builds.
  pageExtensions: isDev ? ["dev.tsx", "dev.ts", "tsx", "ts"] : ["tsx", "ts"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Keep the bulky data files out of client bundles; they are only read at build time.
  outputFileTracingExcludes: { "*": ["data/raw/**"] },
  // The 1080×1080 "square" image was replaced by the 1080×1920 Story image; keep old shared links working.
  async redirects() {
    return [
      { source: "/birthday/:mmdd/square", destination: "/birthday/:mmdd/story", permanent: false },
      // The per-date OG image moved under /card (generateImageMetadata) so each date gets its own alt text.
      // Links cached by social platforms keep working.
      {
        source: "/birthday/:mmdd/opengraph-image",
        destination: "/birthday/:mmdd/opengraph-image/card",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
