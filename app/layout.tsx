import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DISCLAIMER, KEYWORDS, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_TAGLINE} | ${SITE_NAME}`, template: `%s | ${SITE_NAME}` },
  description: "Pick your birthday and see every official Cristiano Ronaldo goal scored on your day, with videos.",
  keywords: KEYWORDS,
  applicationName: SITE_NAME,
  openGraph: { siteName: SITE_NAME, type: "website", locale: "en" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0d0c" },
    { media: "(prefers-color-scheme: light)", color: "#0b0d0c" },
  ],
  width: "device-width",
  initialScale: 1,
};

// Applies the saved theme before paint (dark by default). Tiny and inline to avoid a flash.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light")document.documentElement.dataset.theme="light"}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh flex flex-col bg-bg text-text">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-gold focus:text-gold-ink focus:px-3 focus:py-2 focus:rounded"
        >
          Skip to content
        </a>
        <header className="mx-auto w-full max-w-xl px-4 pt-3 flex items-center justify-between">
          <Link href="/" className="font-black tracking-tight text-base min-h-11 inline-flex items-center gap-2">
            <span aria-hidden="true" className="text-xl">
              ⚽
            </span>
            <span>
              Scored<span className="text-gold">On</span>My<span className="text-gold">Birthday</span>
            </span>
          </Link>
          <ThemeToggle />
        </header>
        <main id="main" className="flex-1 w-full">
          {children}
        </main>
        <footer className="mx-auto w-full max-w-xl px-4 pt-10 pb-28 text-xs leading-relaxed text-muted">
          <p>{DISCLAIMER}</p>
          <p className="mt-2">
            International goal data from{" "}
            <a
              className="underline"
              href="https://en.wikipedia.org/wiki/List_of_international_goals_scored_by_Cristiano_Ronaldo"
            >
              Wikipedia
            </a>{" "}
            (
            <a className="underline" href="https://creativecommons.org/licenses/by-sa/4.0/">
              CC BY-SA 4.0
            </a>
            ). Club goal data from Wikipedia and the{" "}
            <a
              className="underline"
              href="https://www.kaggle.com/datasets/azminetoushikwasi/lionel-messi-vs-cristiano-ronaldo-club-goals"
            >
              Messi vs Ronaldo Club Goals dataset
            </a>{" "}
            by Azmine Toushik Wasi (
            <a className="underline" href="https://opendatacommons.org/licenses/odbl/1-0/">
              ODbL
            </a>
            ).
          </p>
          <nav className="mt-3 flex gap-4" aria-label="Footer">
            <Link className="underline min-h-11 inline-flex items-center" href="/about">
              About &amp; sources
            </Link>
            <Link className="underline min-h-11 inline-flex items-center" href="/">
              Check a date
            </Link>
          </nav>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
