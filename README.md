# Did Ronaldo score on my birthday?

Pick a day and month, and see every **official** Cristiano Ronaldo goal scored on that calendar day, in any year,
with a video of each match and a shareable result page (`/birthday/MM-DD`) that has its own preview image.

- Next.js 16 (App Router) + TypeScript + Tailwind 4. Every page is static: 366 birthday pages, plus home, about and 404.
- No database, no runtime backend. The data is a versioned JSON file (`data/goals.json`, 985 goals) that is validated
  before every build.
- Share images (1200×630 OG + 1080×1080 "status" image) are rendered at build time with `next/og`.

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

YouTube's default quota allows ~100 searches a day, so videos are found **per match** (662 matches), newest first.

```bash
npm run data:videos -- --dry-run          # show queries, spend nothing
npm run data:videos -- --limit 20         # 20 searches
npm run data:videos                       # next 90 (one day's quota); stop/resume any time
npm run data:check-videos                 # weekly: flag removed/private videos (~15 units)
```

Daily plan: run `npm run data:videos` once a day for about 8 days. After each run, open
<http://localhost:3000/admin/review> in `npm run dev` and promote good matches to **verified** (✅), reject bad
ones (❌), or paste a better video id and a start second. The review page and its API only exist in dev; they are
`*.dev.tsx` files that production builds don't route. Matches without a usable video show a **Watch on YouTube**
search button, never a broken embed.

## Deploying to Vercel (free tier)

1. Push this repo to GitHub.
2. In Vercel, choose **Add New → Project**, import the repo, and keep the defaults (framework: Next.js, build: `npm run build`).
3. **Settings → Environment Variables**: add `NEXT_PUBLIC_SITE_URL` = your domain (e.g. `https://scoredonmybirthday.com`).
4. **Analytics → Enable** (Vercel Web Analytics; no cookies, no banner). Events tracked: `date_searched`,
   `share_tapped`, `video_played`.
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
- One font family (Archivo via `next/font`, `display: swap`).
- First-load JS on a result page is ~141 KB gzipped: React DOM (~64 KB) + the Next.js App Router runtime (~67 KB)
  + ~8 KB of app code. The spec's 100 KB target isn't reachable on the App Router; the framework baseline alone
  exceeds it.

## Legal

Unofficial fan project. Not affiliated with Cristiano Ronaldo, his clubs, or any league. No photos, crests or logos.
Videos are embedded via YouTube's official player only. Data: Wikipedia (CC BY-SA 4.0) and the Kaggle dataset by
Azmine Toushik Wasi (ODbL); `data/goals.json` is offered under the ODbL.
