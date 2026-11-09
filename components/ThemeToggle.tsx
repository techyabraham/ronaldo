"use client";
import { useClientValue } from "@/lib/useClientValue";

const EVENT = "themechange";
const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
};
const isLight = () => document.documentElement.dataset.theme === "light";

export function ThemeToggle() {
  const light = useClientValue(isLight, false, subscribe);
  const toggle = () => {
    const next = !light;
    if (next) document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem("theme", next ? "light" : "dark");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(EVENT));
  };
  return (
    <button
      type="button"
      onClick={toggle}
      className="min-h-11 min-w-11 rounded-full border border-border bg-surface text-lg"
      aria-label={light ? "Switch to dark theme" : "Switch to light theme"}
      aria-pressed={light}
    >
      <span aria-hidden="true">{light ? "🌙" : "☀️"}</span>
    </button>
  );
}
