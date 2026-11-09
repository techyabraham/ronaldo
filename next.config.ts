import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
};

export default nextConfig;
