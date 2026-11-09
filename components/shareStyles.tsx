/** Brand-coloured share buttons. Colours chosen to keep WCAG AA contrast with their text. */
const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 font-black transition active:translate-y-0.5";

export const shareBtn = {
  whatsapp: `${base} bg-[#25D366] text-[#052e14]`,
  x: `${base} bg-black text-white ring-1 ring-white/20`,
  facebook: `${base} bg-[#0866FF] text-white`,
  telegram: `${base} bg-[#2AABEE] text-[#04202e]`,
  neutral: `${base} border border-border bg-surface-2 text-text`,
  primary: `${base} bg-gold text-gold-ink shadow-[0_6px_0_0_rgba(0,0,0,0.35)]`,
};

export function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.7-.3-1.4-.7-2-1.3-.5-.5-1-1.1-1.3-1.7-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.6.6-.9 1.4-.9 2.2 0 .9.4 1.8 1 2.6 1 1.5 2.4 2.7 4 3.4.9.4 1.7.6 2.5.5.7-.1 1.4-.6 1.7-1.2.2-.4.2-.9.1-1.1l-.6-.4z" />
    </svg>
  );
}
