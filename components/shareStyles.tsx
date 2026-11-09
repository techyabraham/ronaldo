/** Share buttons in the GOAT Day palette. Contrast: --green-ink on --green 6.4:1, white on --red 4.6:1. */
const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 font-extrabold transition active:translate-y-0.5";

export const shareBtn = {
  whatsapp: `${base} bg-green text-green-ink`,
  neutral: `${base} border border-border bg-surface-2 text-text`,
  primary: `${base} bg-red text-white`,
  // Brand colours dropped on purpose: neutral tiles with the brand name read better in this palette.
  x: `${base} border border-border bg-surface-2 text-text`,
  facebook: `${base} border border-border bg-surface-2 text-text`,
  telegram: `${base} border border-border bg-surface-2 text-text`,
};

export { WhatsAppIcon } from "./icons";
