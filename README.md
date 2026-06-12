# FIFA World Cup 2026 — Live Wall Chart (Google Sheets backend)

A single-page, mobile-friendly web wall chart. Scores and knockout team names
live in a **Google Sheet**; the page reads them live and refreshes every
30 seconds. Update the sheet from any device — no redeploy, no git commit.
A "last updated" timestamp in the sheet is shown in the page's status bar.

## Files

| File | What it is |
|------|-----------|
| `index.html` | The page. Overlays 272 fields on the chart and reads them from your sheet. |
| `config.js` | **Edit this once** — paste your Google Sheet ID. |
| `chart.jpg` | High-res background artwork. |
| `fields.json` | The 272 field positions (% coordinates). Generated; don't hand-edit. |
| `sheet_template.csv` | Import this into Google Sheets to create your data tab. |

## 1) Create your Google Sheet

1. Go to <https://sheets.new> to make a new spreadsheet.
2. **File → Import → Upload → `sheet_template.csv`**, choosing
   **"Replace current sheet"**. Under import options, set
   **"Convert text to numbers, dates, and formulas" → No** (this keeps the
   Value column as text so team names aren't dropped — see Troubleshooting).
   You'll get seven columns:
   `Description | Field ID | Value | Scorers | Clock | Phase | Anchor`.
   - **Description** — human labels like `Group A · MEX v RSA · MEX score`
     and `Round of 32 Match 1 · [1E] team name`. For your eyes only.
   - **Field ID** — the machine id the page looks up. **Don't change these.**
   - **Value** — the column **you type into** (scores and knockout team names).
   - **Scorers** — *optional* per-score goalscorer text shown as a tooltip when
     you hover or keyboard-focus that score box (e.g. `Shankland 11'` or
     `Cunha 33', 43' (P), Richarlison 77'`). Free-form — shown verbatim.
   - **Clock / Phase / Anchor** — power the live game-clock pill. See
     *Live game clock* below. (Clock holds a formula; you edit Phase/Anchor.)

   > **Important about the formula:** the `Clock` column contains a live formula.
   > Google Sheets' importer keeps a leading-`=` cell as a real formula even
   > with "Convert text to numbers" off, but **double-check one Clock cell after
   > import shows a formula** (click it — you should see `=LET(...)`, not literal
   > text). If it imported as text, re-paste the formula into the first Clock
   > cell and fill down, or just type clock values manually (see that section).
3. Rename the tab at the bottom to **`Scores`** (or set `SHEET_NAME` in
   `config.js` to match whatever you call it).
4. **Share → General access → "Anyone with the link" → Viewer.** (Read-only
   for the public; only you, the owner, can edit. No API key is needed.)

## 2) Point the page at your sheet

Open `config.js` and paste your Sheet ID — the long string in the sheet URL
between `/d/` and `/edit`:

```
https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit#gid=0
```

```js
window.CHART_CONFIG = {
  SHEET_ID: "1AbC...your...id...XyZ",
  SHEET_NAME: "Scores",
  ID_COLUMN: "Field ID",
  VALUE_COLUMN: "Value",
  SCORERS_COLUMN: "Scorers",
  CLOCK_COLUMN: "Clock",
  REFRESH_MS: 30000,
};
```

## 3) Publish on GitHub Pages

Put these files in the repo root: `index.html`, `config.js`, `chart.jpg`,
`fields.json` (the CSV is just for the one-time import; you can include it or not).

```bash
git init
git add index.html config.js chart.jpg fields.json sheet_template.csv README.md
git commit -m "Live World Cup 2026 wall chart (Google Sheets backend)"
git branch -M main
git remote add origin https://github.com/<you>/wc26-wallchart.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Deploy from a branch → `main` / `/ (root)`**.
Live at `https://<you>.github.io/wc26-wallchart/` in ~1 minute.

## Display on a TV / kiosk

For an unattended screen (e.g. a TV at a bar), add **`?fit`** to the URL:

```
https://<you>.github.io/wc26-wallchart/?fit
```

This sizes the **whole chart to fit the visible area** — constrained by both
width and height — and centres it, so the entire bracket is visible with **no
scrolling**. Pair it with the browser's fullscreen/kiosk mode (often `F11`, or
the TV browser's kiosk setting) to hide the browser toolbars for an edge-to-edge
display.

- Use `?fit` on **landscape** displays (TVs, monitors). On a **portrait phone**
  the normal URL (no `?fit`) reads better — it keeps the full-width, scrollable
  view rather than shrinking the wide chart to a tiny strip.
- The fit recomputes automatically if the screen resolution or orientation
  changes. All other features (live updates, tooltips, etc.) work the same.

## Updating scores during a match

Just edit the **Value** column in your Google Sheet (phone or laptop). Within
~30 seconds every viewer's page updates — no commit, no redeploy.

- **Group matches:** fill home/away score rows (e.g. `MEX score`, `RSA score`).
- **Knockout matches:** fill the team-name rows as teams qualify (the
  Description shows the slot, e.g. `[1E]`, `[M1]`), plus the score rows.

### Goalscorer tooltips (optional)

Type goalscorer info into the **Scorers** column next to any score. When a
viewer hovers (or keyboard-focuses) that score box, a tooltip shows the text
exactly as typed. Example for `SCO 1 – 3 BRA`:

| Field ID | Value | Scorers |
|---|---|---|
| `…_home_score` (SCO) | `1` | `Shankland 11'` |
| `…_away_score` (BRA) | `3` | `Cunha 33', 43' (P), Richarlison 77'` |

- It's **per score box** and entirely optional — a box with no Scorers text
  simply has no tooltip (and isn't focusable).
- Works for **all** score boxes, group and knockout.
- Format is free-form; whatever you type is shown verbatim.

### Penalty shootouts

If a knockout match is decided on penalties, type the shootout count in
parentheses right after the regular (post-extra-time) score, e.g. for
`ARG 3(4) – 3(2) FRA`:

| Field ID | Value |
|---|---|
| `…_top_score` (ARG) | `3(4)` |
| `…_bottom_score` (FRA) | `3(2)` |

- The page shows the regular score full-size with the shootout count as a
  small **superscript** — so `3(4)` reads as a bold **3** with a raised `(4)`.
- The pattern is strict: only `number(number)` is treated this way (so plain
  scores and team names are never affected). `0(3)` works for goalless ties.
- **Scorers tooltips are unaffected** — keep listing only the goals scored
  through extra time (the shootout isn't part of the scorer list). E.g. the
  `3(4)` box's Scorers cell should hold the three open-play/ET scorers.

## Live game clock

Each match has a small dark **clock pill** (white condensed text + a pulsing red
"live" dot) that appears on the card *only while the game is in progress*. It's
driven by two helper columns the template adds — **`Phase`** and **`Anchor`** —
plus a pre-filled **`Clock`** formula. You never edit the Clock cell; you just
change the Phase (and, at each restart, the Anchor).

### One-time setup
1. Set **File → Settings → Calculation → Recalculation → "On change and every
   minute"** so the live minute ticks on its own.
2. The template already seeds each match's **`Anchor`** to its kickoff time and
   leaves **`Phase`** blank (so no pill shows until you start it).

### Live playbook (per match)
At each moment of the game, set that match's **`Phase`** cell (and `Anchor`
where noted). The pill updates within ~30s.

| Moment | Set `Phase` to | Also set `Anchor` to | Pill shows |
|---|---|---|---|
| Kick-off | `1` | kickoff time *(already seeded)* | `1'`…`45'` |
| Half-time | `HT` | — | `HT` |
| 2nd-half restart | `2` | **now** | `46'`…`90'` |
| Full time (decided) | `FT` | — | `FT` *(no dot)* |
| Level at FT → extra time | `ET` | — | `ET` |
| ET 1st-half kick-off | `E1` | **now** | `91'`…`105'` |
| ET half-time | `ETHT` | — | `ET` / `HT` *(stacked)* |
| ET 2nd-half restart | `E2` | **now** | `106'`…`120'` |
| Still level after ET → pens | `AET` | — | `AET` *(no dot)* |
| Game over / clear it | *(blank)* | — | *(pill hidden)* |

Notes:
- The clock **holds** at `45'`, `90'`, `105'`, `120'` through stoppage time
  (it doesn't run past them) — you flip to `HT`/`FT`/etc. at the real whistle.
- Setting `Anchor` to "now" at each restart keeps the clock **anchored to the
  actual restart**, so it resumes at the right minute with no drift.
- The pulsing dot shows for every live state; it's **dropped for `FT` and
  `AET`** (nothing is live). A blank Phase hides the pill entirely.
- Extra time (and its `ETHT` 3-row pill) only occurs in **knockout** games.

> Prefer fully manual? You can ignore Phase/Anchor and just type a literal value
> into the **`Clock`** cell (e.g. `67'`, `HT`, `ET/HT`, `FT`) — the pill renders
> whatever's there. The formula is the convenience option, not a requirement.

## "Last updated" timestamp

The status bar at the top of the page shows when the scores were last updated.
There's a special row in the sheet for this:

| Description | Field ID | Value |
|---|---|---|
| ⏱ Last updated … | `_updated` | *(a date/time)* |

This row is **not drawn on the chart** — it only feeds the status bar. You can:

- **Fill it manually** — type any text (e.g. `2026-06-11 21:05` or `Just now`).
  If it's a recognisable date it's shown in the viewer's local format;
  otherwise the raw text is shown as-is.
- **Auto-fill it** (recommended) — add the tiny Apps Script below so the cell
  stamps itself every time you edit any score.

### Apps Script: live heartbeat + auto-stamp

The page reads the sheet through gviz, which serves a **saved snapshot**. A
formula that recalculates on a timer (like the live `Clock`, driven by `NOW()`)
updates the Sheets UI but is **not** pushed to gviz until the sheet is actually
*written* to. So a tiny script must "touch" the sheet on a schedule — that write
forces a recalculation **and** refreshes the gviz snapshot, so the live clocks
reach the page. (Without it, clocks only update when you manually edit a cell.)

1. In your sheet: **Extensions → Apps Script**.
2. Replace the contents with this, then **Save**:

   ```js
   const TAB = "Scores";   // your tab name

   // Write the current time into the _updated cell. This single write forces
   // Sheets to recalc NOW()-based formulas (the live clocks) AND refreshes the
   // gviz snapshot the web page reads.
   function heartbeat() {
     const sh = SpreadsheetApp.getActive().getSheetByName(TAB);
     if (!sh) return;
     const data = sh.getRange(1, 1, sh.getLastRow(), 2).getValues();
     for (let r = 0; r < data.length; r++) {
       if (String(data[r][1]).trim() === "_updated") {       // col B = Field ID
         // _updated is column C (Value). Adjust if your columns differ.
         sh.getRange(r + 1, 3).setValue(new Date().toISOString());
         SpreadsheetApp.flush();                              // commit the write
         return;
       }
     }
   }

   // Keep an on-edit stamp too, so manual edits refresh immediately.
   function onEdit(e) {
     if (e.range.getSheet().getName() === TAB) heartbeat();
   }
   ```

3. **Add the time-driven trigger:** in the Apps Script editor, click the
   **Triggers** (clock) icon → **Add Trigger** →
   - Function: **`heartbeat`**
   - Event source: **Time-driven** → **Minutes timer** → **Every minute**
   - Save (authorise the script when prompted).

That's it. The `_updated` cell now refreshes once a minute, which ticks the live
clocks **and** publishes them to the page. Your "last updated" status bar also
stays genuinely live as a bonus.

> **Note on cadence:** Apps Script's fastest time-driven trigger is **once per
> minute**, so the clocks advance at minute resolution — exactly right for a
> match clock. End-to-end latency is that minute, plus your page's poll
> (`REFRESH_MS`, default 30s) and gviz's short cache, so a change can take up to
> ~1–2 minutes to appear. That's normal and fine for a game clock. (Manual edits
> still refresh immediately via `onEdit`.)

## How the live read works

The page fetches your sheet through Google's public **gviz JSON** endpoint
(`/gviz/tq?tqx=out:json&sheet=Scores`). It's free, needs no API key, works from
a static host, and is requested with a cache-buster each cycle so updates show
up promptly. Values map to fields by the **Field ID** column.

> **Why JSON, not CSV?** gviz infers a single type per column. Because the
> Value column is mostly digits, gviz types it as *numeric* — and in CSV mode
> that makes the **text** cells (your knockout team names) come back **blank**.
> The JSON response returns every cell's value regardless of column type, so
> scores *and* team names both arrive. (It also returns clean score strings
> like `2` rather than `2.0`.)

> Note: Google may cache the response for a short time, so an edit can take a
> few tens of seconds beyond the refresh interval to appear. That's normal.

## Field id scheme (reference)

- Group scores: `group01_home_score`, `group01_away_score` … `group72_*`
  (home = left team in `X v Y`, away = right team).
- Knockout: `koNN_top_team`, `koNN_bottom_team`, `koNN_top_score`,
  `koNN_bottom_score` for `NN` = 01…32. `ko19` is the Final; `ko28` is the
  third-place play-off. You normally never need these — use the Description.

## Troubleshooting

**The chart loads but no scores/names appear.**
- Check the **sheet sharing**: it must be *Anyone with the link → Viewer*.
  A private sheet returns an error page (often HTML), not the expected data.
- Check `config.js`: `SHEET_ID` must be the long id from the URL (between
  `/d/` and `/edit`), **not** the whole URL, and not still `PASTE_…`.
- Check the tab name: `SHEET_NAME` in `config.js` must match the tab exactly
  (case-sensitive). Default is `Scores`.

**Status bar says "set SHEET_ID in config.js".**
- You haven't replaced the placeholder. Open `config.js`, paste your id, commit.

**Status bar says "couldn't reach sheet — retrying".**
- The fetch failed. Open the browser console (the page logs the error).
  Most common causes: sheet not shared publicly, wrong `SHEET_ID`, or a
  network blip (it auto-retries every cycle, so transient issues self-heal).

**Some values show but others don't / values land in the wrong box.**
- A **Field ID** was edited or a row deleted. The `Field ID` column must match
  the originals exactly (see the scheme above). The safest fix is to re-import
  `sheet_template.csv` and re-enter values into the **Value** column only.
- Make sure you typed into the **Value** column, not the Description column.

**Scores appear but team names stay on the colour (kaleidoscope) fill.**
- This was a gviz typing quirk: a number-heavy Value column read in CSV mode
  dropped the text (team-name) cells. The page now uses the gviz **JSON**
  endpoint, which returns text and numbers alike — so this is fixed. If you
  ever see it again, make sure you're running the current `index.html`
  (it requests `tqx=out:json`, not `out:csv`).

**A team name looks small / how does long text fit?**
- Each box auto-fits its text: short names (e.g. `SPAIN`) show at the full
  size, while long ones (e.g. `SWITZERLAND`, `NETHERLANDS`) automatically
  shrink just enough to sit inside the box. Sizing is per-box and recalculated
  on every refresh and on window resize/rotate, so names always stay snug.
- If you'd still prefer a larger, more uniform look for a very long name, use a
  short form (e.g. `S. KOREA`, `CZECHIA`) — but it's no longer required.

**The "last updated" time looks wrong or shows raw text.**
- A recognisable date (e.g. ISO `2026-06-11T21:05:00Z`) is shown in local time;
  anything else is shown verbatim. If using the Apps Script, confirm the tab
  name inside it matches your sheet's tab. If the cell is blank, the bar falls
  back to the viewer's own refresh time — that's expected.

**Edits take a while to appear.**
- Two layers of delay: your `REFRESH_MS` (default 30s) plus Google's short
  response cache (usually tens of seconds). Up to ~1 minute total is normal. To
  poll faster, lower `REFRESH_MS` in `config.js` (don't go below ~10000).

**GitHub Pages shows an old version after I push.**
- Pages can serve cached assets for a minute or two. Hard-refresh
  (Cmd/Ctrl+Shift+R) once, or wait briefly. Note: pushing only changes the
  *site files* — score updates come from the sheet and don't need a push.

**404 on GitHub Pages.**
- Confirm `index.html` is in the **repo root** (not inside a subfolder), and
  that Pages is set to **Deploy from a branch → `main` / `/ (root)`**. The
  first build can take a minute after you enable it.

**I changed the artwork / fields and now positions are off.**
- `fields.json` and `chart.jpg` are generated from the source PDF. If the
  underlying chart changes, regenerate both (see *Regenerating* in the project
  scripts) so coordinates and image stay in sync.

