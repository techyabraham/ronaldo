# GOAT Day: did Ronaldo score on my birthday?

Pick a day and month, and see every **official** Cristiano Ronaldo goal scored on that calendar day, in any year,
with a video of each match and a shareable result page (`/birthday/MM-DD`) that has its own preview image.

- Next.js 16 (App Router) + TypeScript + Tailwind 4. Every page is static: 366 birthday pages, plus home,
  `/calendar`, about and 404.
- No database, no runtime backend. The data is a versioned JSON file (`data/goals.json`) that is validated before
  every build.
- Share images (1200×630 link preview + 1080×1920 Story/Status image) are rendered at build time with `next/og`.

## The GOAT Day brand

- **Look:** a dark, streaming-app feel in Portugal red (`--red`) and green (`--green`), with Anton for display type
  and Archivo for body text. The signature motif is the 2:3 green/red flag bar (`components/FlagBar.tsx`). Dark
  only. Colour tokens and their contrast notes are in `app/globals.css`.
- **Voice:** Ronaldo first. Headlines, share text and page titles say "Ronaldo" (that's what people search for and
  what makes sense in a group chat); "the GOAT" is an accent, as in "Even the GOAT takes a day off."
- **Credit:** every share carries the creator: X posts end with "Created by @AkinwumiX", other channels end with
  "Made by Abraham Akinwumi: https://x.com/AkinwumiX" after the site link (`CREDIT_X` / `CREDIT_LINK` in `lib/site.ts`).
- **No photos, crests, league logos or "CR7" mark.** Text, the crown SVG and the flag colours only.
- **Every number in the copy is live from the data** (total goals, the number of scoring and rest days, seasons,
  Portugal goals, per-club totals). Nothing is hard-coded, so the weekly refresh updates the whole site. The only
  static facts are five Champions League titles, the Ali Daei record, and the 88th-minute free kick vs Spain
  (all in `lib/moments.ts`, and unit-tested against the data where possible).
- **Features:** the Reveal intro after picking a date (`RevealOverlay`), the one-shot **SIUUU** celebration on dates
  with goals (`SiuuCelebration`, CSS-only, skipped under reduced motion), and **"The official excuse"** for the 78ish
  dates he never scored on (`lib/excuses.ts`; deterministic, affectionate, and any number it quotes comes from the
  data).

### Celebration photos (owner-supplied)

The site owner supplied one Siuu photo per era. **Only use photos you have the rights to**, and never crop out a
photographer's or agency's watermark (that's why a Reuters-watermarked shot was left out). Nothing is ever
hot-linked or scraped from the web.

| Key (`lib/photos.ts`) | Used for |
|---|---|
| `portugal-back` | Home hero; hero of any date whose most famous match was for Portugal; home link preview |
| `portugal`, `real-madrid`, `juventus`, `man-utd`, `al-nassr` | That team's result heroes, episode thumbnails, Trending tiles, GOAT moments, team avatars and share images |
| `rest` (shown in greyscale) | The "off duty" header on dates he never scored, and their share images |

Each goal page uses the kit of its most famous match (`rankFamous`); Sporting CP has no photo, so those fall back
to the flag-and-crown artwork. To replace or add photos, update `SOURCES` in `scripts/prepare-photos.ts` and run:

```bash
npx tsx scripts/prepare-photos.ts "C:/path/to/photo/folder"
```

It writes responsive WebP files to `public/siu/` and pre-cropped JPEGs for the share images to `assets/og/`
(the share-image renderer can't read WebP). Commit both, then rebuild.

### Favicon

`app/icon.svg` (the red crown over the green/red flag bar) is the source. After editing it, run
`npm run icons` to regenerate `app/favicon.ico` (16/32/48) and `app/apple-icon.png` (180, square; iOS rounds it).
Next.js links all three automatically.

## Quick start

```bash
npm install
npm run dev            # http://localhost:3000
```

Other commands:

| Command | What it does |
|---|---|
| `npm run build` | validates the dataset, then builds every page and image (~3 min) |
| `npm test` | unit + data tests (Vitest) |
| `npm run test:e2e` | Playwright on a 360×740 phone viewport (runs `next start`, so build first) |
| `npm run lint` / `npm run typecheck` / `npm run format` | the usual |
| `npm run lhci` | Lighthouse CI against a local production build |

## Environment variables

Copy `.env.example` to `.env.local`.

| Name | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Vercel (Production) + `.env.local` | Absolute URL for canonical links, the sitemap and the URL printed on share images. **Set this before the first production build** or the images will show the Vercel URL. |
| `YOUTUBE_API_KEY` | `.env.local` + GitHub secret | Used **only** by `scripts/find-videos.ts` and `scripts/check-videos.ts`. Never shipped to the browser. |
| `REFRESH_TOKEN` | GitHub secret (optional) | Fine-grained PAT (contents + pull-requests: write). Lets the weekly data PR trigger CI. |

## Data

Sources and licences: see [`data/SOURCES.md`](data/SOURCES.md).

```
data/
  goals.json               the dataset (generated, committed)
  expected.json            the totals validation must match; bump when he scores
  videos.json              one YouTube video per match (status: verified | auto | missing | rejected)
  aliases.json             team / opponent / competition name normalisation
  trusted-channels.json    official channels that get a boost when matching videos
  manual/club-2022-2026.csv  hand corrections for recent club goals (add or remove rows)
  generated/by-date.json   MM-DD -> goal ids (all 366 keys)
  raw/                     source extracts (cache/ is git-ignored)
```

Pipeline (each step is idempotent and caches downloads in `data/raw/cache/`):

```bash
npm run data:fetch       # Wikipedia (Portugal), Kaggle CSV (club to Mar 2023), Wikipedia season articles (Al Nassr)
npm run data:build       # merge, normalise, number goals 1..N, write goals.json + by-date index
npm run data:validate    # totals, per-club totals, dates, duplicates, 366-day index, known-goal fixtures
```

### When Ronaldo scores (the weekly job does this for you)

`.github/workflows/refresh.yml` runs every Monday (or from the **Actions** tab, via "Run workflow"). It re-reads the
Al-Nassr season article, rebuilds, compares the total with the career table on Wikipedia's *Cristiano Ronaldo* page,
bumps `data/expected.json` if they agree, and opens a **pull request** listing the new goals. Review it and merge;
Vercel redeploys.

To do it by hand:

```bash
npm run data:refresh     # same as the weekly job
npm run data:validate
git commit -am "data: new goals" && git push
```

If the totals **disagree** (Wikipedia's season article is usually a few days behind, or a goal is disputed), add the
missing goal as a row in `data/manual/club-2022-2026.csv`, with the source and a `notes` explanation if it's disputed,
then `npm run data:build && npm run data:validate`. To drop a goal, add a row with `action` = `remove` and its `date`
and `minute`. Then update `data/expected.json` (total, `perTeam`, `latestGoalDate`, `checkedAt`).

Portugal goals are final: he retired from international football on 5 Nov 2026.

### Videos

YouTube's default quota allows ~100 searches a day, so videos are found **per match** (662 matches), **featured first**:
the headline match of every scoring date (the ~288 "featured" matches, dates with the most goals first), then the
rest, newest first. Featured-only puts a playable video on every date's top match in about 3 days of quota; all 662
matches take about 8 days.

```bash
npm run data:videos -- --dry-run          # show queries, spend nothing
npm run data:videos -- --limit 20         # 20 searches
npm run data:videos -- --featured-only    # only each date's headline match
npm run data:videos                       # next 90 (one day's quota); stop/resume any time
npm run data:check-videos                 # weekly: flag removed/private videos (~15 units)
```

Daily plan: run `npm run data:videos -- --featured-only` once a day for about 3 days, then `npm run data:videos`
until all 662 are done (about 5 more days). After each run, open
<http://localhost:3000/admin/review> in `npm run dev` and promote good matches to **verified** (✅), reject bad
ones (❌), or paste a better video id and a start second. The review page and its API only exist in dev; they are
`*.dev.tsx` files that production builds don't route. Matches without a usable video show a **Watch on YouTube**
search button, never a broken embed.

## Deploying to Vercel (free tier)

1. Push this repo to GitHub.
2. In Vercel, choose **Add New → Project**, import the repo, and keep the defaults (framework: Next.js, build: `npm run build`).
3. **Settings → Environment Variables**: add `NEXT_PUBLIC_SITE_URL` = your domain (e.g. `https://scoredonmybirthday.com`).
4. **Analytics → Enable** (Vercel Web Analytics; no cookies, no banner). Events tracked: `date_searched`, `share_tapped` (with `channel` = whatsapp/image/x/facebook/telegram/threads/copy/native and `placement` = quick/sticky/episode/panel/sheet/home/tabbar), `share_sheet_opened`, `video_played`.

5. **Domains**: add your domain, then redeploy so the share images pick up the URL.
6. In GitHub, add the secrets `YOUTUBE_API_KEY` (and optionally `REFRESH_TOKEN`), and under **Settings → Actions →
   General**, allow GitHub Actions to create pull requests.

Build output is ~1,100 static files (≈32 MB of PNGs) and builds in about 3 minutes, well within the free tier.

### Checking share previews

After deploying, paste a result URL (e.g. `https://yourdomain/birthday/05-02`) into:

- <https://www.opengraph.xyz/> (generic OG + X preview)
- <https://developers.facebook.com/tools/debug/> (Facebook/WhatsApp use the same OG tags; click **Scrape Again** after changes)
- <https://cards-dev.x.com/validator> may be unavailable; posting the link in a draft on X shows the card

WhatsApp caches previews per URL for a long time; test with a URL you haven't shared before.

## Performance notes

- Each result page receives only its own date's goals at build time; `goals.json` never reaches the browser.
- YouTube iframes load only after a tap (thumbnail facade, `youtube-nocookie.com`).
- Two font families via `next/font` (`display: swap`): Anton (display) and Archivo (body).
- The Reveal intro is lazy-loaded (`next/dynamic`) only when someone submits a date; the calendar and SIUUU are
  CSS only. SIUUU's word is SVG text, so it can't become the page's Largest Contentful Paint.
- First-load JS on a result page is ~152 KB gzipped: React DOM (~71 KB) + the Next.js App Router runtime
  (~66 KB) + ~15 KB of app code. A 100 KB target isn't reachable on the App Router; the framework baseline alone
  exceeds it. The 39 KB `nomodule` polyfill chunk is skipped by modern browsers.
- Lighthouse on Windows dev machines is noisy (Chrome's first text layout is slow there, and the CPU benchmark
  swings run to run). Trust the Linux CI run (`lhci autorun`, median of 3) or PageSpeed Insights on the deployed site.

## Legal

Unofficial fan project. Not affiliated with Cristiano Ronaldo, his clubs, or any league. No photos, crests or logos.
Videos are embedded via YouTube's official player only. Data: Wikipedia (CC BY-SA 4.0) and the Kaggle dataset by
Azmine Toushik Wasi (ODbL); `data/goals.json` is offered under the ODbL.
