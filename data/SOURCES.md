# Data sources

Last verified: **9 November 2026**. Counting rule: **official senior goals only** (club + Portugal senior team).
Youth internationals, friendlies between clubs, and penalty-shootout kicks are excluded. Extra-time goals count.

## Totals (`data/expected.json`)

| Team              | Goals                                 | Source                                                                                               |
| ----------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Sporting CP       | 5                                     | Wikipedia, _Cristiano Ronaldo_ → Career statistics → Club (updated "match played 29 October 2026")   |
| Manchester United | 145 (118 + 27)                        | same                                                                                                 |
| Real Madrid       | 450                                   | same                                                                                                 |
| Juventus          | 101                                   | same                                                                                                 |
| Al Nassr          | 138 (14 / 50 / 35 / 30 / 9 by season) | same                                                                                                 |
| Portugal          | 146                                   | Wikipedia, _List of international goals scored by Cristiano Ronaldo_                                 |
| **Total**         | **985**                               | Matches the messivsronaldo.app total quoted in the spec and ESPN's goal tracker ("985 and counting") |

Anchors cross-checked against news coverage: goal 979 = header vs Abha (9 Sep 2026), goal 980 = vs Diriyah (9 Oct 2026),
goal 982 = vs Al Faisaly (23 Oct 2026), 983–985 = hat-trick vs Al-Kholood (29 Oct 2026).

Note: Wikipedia's international list says 234 caps (the spec said 233). Caps aren't used by the app.

## A. International goals (146): Wikipedia

- Page: https://en.wikipedia.org/wiki/List_of_international_goals_scored_by_Cristiano_Ronaldo
- Fetched via the MediaWiki API (`action=parse&prop=text`); the revision id is stored in each goal's `sources`.
- Licence: **CC BY-SA 4.0**. Attribution in the site footer and on /about.
- Minutes are only known for the 10 hat-trick matches (from the hat-trick table); all others are `null`.

## B. Club goals, Oct 2002 → 18 Mar 2023 (710 goals): Kaggle

- "Lionel Messi vs Cristiano Ronaldo | Club Goals" by Azmine Toushik Wasi
  https://www.kaggle.com/datasets/azminetoushikwasi/lionel-messi-vs-cristiano-ronaldo-club-goals
- Collected by the author from Transfermarkt. Includes a `Date` column (ISO).
- Licence: **Open Database License (ODbL) v1.0** (database) / Database Contents License (contents).
  ODbL requires attribution and that derived databases be shared under ODbL, so `data/goals.json` is
  offered under ODbL; see the /about page.
- Raw file committed: `data/raw/kaggle-messi-vs-ronaldo-club-goals.csv` (sha256 `246ceaf1…4cb14`).
- Note: the similarly named "CR7 – Cristiano Ronaldo All Club Goals Stats" on Hugging Face (ECL-2.0) has
  **no Date column**, so it was not used.
- Clean-up applied: mojibake repair (UTF-8 read as Latin-1), Excel-mangled scores ("3:00" → 3-0),
  home/away scores turned team-first, shoot-out-only results moved to `notes`.

## C. Club goals, 19 Mar 2023 → today (129 goals): Wikipedia season articles + manual

Chosen option: **C.1 (Wikipedia)**. API-Football wasn't needed.

- `2022–23 Al-Nassr FC season`, `2023–24 Al Nassr FC season`, `2024–25 Al-Nassr FC season`,
  `2025–26 Al-Nassr FC season`, `2026–27 Al-Nassr FC season` (CC BY-SA 4.0).
- Parsed from `{{Football box collapsible}}` templates; "Pre-season and friendlies" sections are skipped.
- Parsed counts per season match the career table exactly for 2022–23 to 2025–26.
- **Manual correction** (`data/manual/club-2022-2026.csv`): 23 Oct 2026 vs Al Faisaly, 49' header. Wikipedia's
  season article lists it as an own goal (Girotto), and Opta agrees, but the Saudi Pro League's official match
  sheet credits Ronaldo, and the 985 total counts it. Stored with a `notes` field marking it as disputed.
  Sources: ESPN ("Cristiano Ronaldo claims disputed goal in Al Nassr win over Al Faisaly"), Goal.com.

## D. Cross-check only

- messivsronaldo.app: used only for the headline total (985) quoted in the spec. Not scraped; no data copied.
- ESPN goal tracker, The National, Saudi Gazette, Vanguard: milestone goal numbers (see anchors above).

## Not used

- Transfermarkt directly (terms restrict scraping).
- SEO "stats" blogs.
