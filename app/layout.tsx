import type { Metadata, Viewport } from "next";
import { Anton, Archivo } from "next/font/google";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { FlagBar } from "@/components/FlagBar";
import { CrownIcon, SearchIcon } from "@/components/icons";
import { HOME_DESCRIPTION, HOME_TITLE, KEYWORDS, isProductionDeploy } from "@/lib/seo";
import { CREATOR, DISCLAIMER, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700", "800"],
});

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: HOME_TITLE, template: `%s | ${SITE_NAME}` },
  description: HOME_DESCRIPTION,
  keywords: KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: CREATOR.name, url: CREATOR.portfolioUrl }],
  creator: CREATOR.name,
  category: "sports",
  formatDetection: { telephone: false },
  // Previews, CI and local builds must never be indexed; only the Vercel production deployment is.
  robots: isProductionDeploy() ? { index: true, follow: true } : { index: false, follow: false },
  // No canonical here on purpose: every route sets its own (a layout canonical would leak "/" to all pages).
  openGraph: { siteName: SITE_NAME, type: "website", locale: "en_GB" },
  twitter: { card: "summary_large_image", creator: `@${CREATOR.handle}` },
};

export const viewport: Viewport = {
  themeColor: "#0B0B0C",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_TAGLINE,
  creator: { "@type": "Person", name: CREATOR.name, url: CREATOR.portfolioUrl, sameAs: [CREATOR.xUrl] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${anton.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col bg-bg text-text">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-red focus:px-3 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <header className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-1.5">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2" aria-label={`${SITE_NAME} home`}>
            <span className="flex w-7 flex-col items-stretch gap-[3px]" aria-hidden="true">
              <CrownIcon className="h-6 w-7 text-red" />
              <FlagBar height={3} />
            </span>
            <span className="font-display text-2xl leading-none tracking-[0.02em]">GOAT DAY</span>
          </Link>
          <Link
            href="/#pick"
            aria-label="Search a date"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-text"
          >
            <SearchIcon />
          </Link>
        </header>
        <main id="main" className="w-full flex-1">
          {children}
        </main>
        <footer className="mx-auto w-full max-w-md px-4 pt-10 pb-36 text-xs leading-relaxed text-faint">
          <p className="flex flex-wrap items-center gap-x-1 text-sm text-muted">
            Built by
            <a
              className="inline-flex min-h-11 items-center font-bold text-text underline"
              href={CREATOR.portfolioUrl}
              rel="author noopener"
            >
              {CREATOR.name}
            </a>
            <span aria-hidden="true">·</span>
            <a
              className="inline-flex min-h-11 items-center font-bold text-text underline"
              href={CREATOR.xUrl}
              rel="me noopener"
            >
              @{CREATOR.handle}
            </a>
          </p>
          <p className="mt-2">{DISCLAIMER}</p>
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
            <Link className="inline-flex min-h-11 items-center underline" href="/about">
              About &amp; sources
            </Link>
            <Link className="inline-flex min-h-11 items-center underline" href="/">
              Check a date
            </Link>
            <Link className="inline-flex min-h-11 items-center underline" href="/calendar">
              Calendar
            </Link>
          </nav>
        </footer>
        <script
          type="application/ld+json"
          // JSON-LD from constants only; escape "<" so no string can close the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <Analytics />
      </body>
    </html>
  );
}
