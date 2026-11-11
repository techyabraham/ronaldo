import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

/**
 * Sponsor off switch: builds the site with NEXT_PUBLIC_PARTNER=off into .next-partner-off (so the normal
 * .next build is untouched), serves it, and runs only the "@partner-off" test. `npm run test:e2e:partner-off`.
 */
const PORT = 3101;
const env = { NEXT_PUBLIC_PARTNER: "off", NEXT_DIST_DIR: ".next-partner-off" };

export default defineConfig({
  ...base,
  grep: /@partner-off/,
  use: { ...base.use, baseURL: `http://localhost:${PORT}` },
  projects: [{ name: "partner-off", use: process.env.CI ? {} : { channel: "chrome" } }],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    port: PORT,
    env,
    reuseExistingServer: false,
    timeout: 900_000,
  },
});
