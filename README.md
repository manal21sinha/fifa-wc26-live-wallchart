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
   **"Replace current sheet"**. You'll get three columns:
   `Description | Field ID | Value`.
   - **Description** — human labels like `Group A · MEX v RSA · MEX score`
     and `Round of 32 Match 1 · [1E] team name`. For your eyes only.
   - **Field ID** — the machine id the page looks up. **Don't change these.**
   - **Value** — the column **you type into** (scores and knockout team names).
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

## Updating scores during a match

Just edit the **Value** column in your Google Sheet (phone or laptop). Within
~30 seconds every viewer's page updates — no commit, no redeploy.

- **Group matches:** fill home/away score rows (e.g. `MEX score`, `RSA score`).
- **Knockout matches:** fill the team-name rows as teams qualify (the
  Description shows the slot, e.g. `[1E]`, `[M1]`), plus the score rows.

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

### Optional: auto-stamp on every edit

1. In your sheet: **Extensions → Apps Script**.
2. Replace the contents with this, then **Save**:

   ```js
   function onEdit(e) {
     const sh = e.range.getSheet();
     if (sh.getName() !== "Scores") return;        // match your tab name
     // find the row whose "Field ID" is "_updated" and stamp its "Value"
     const data = sh.getRange(1, 1, sh.getLastRow(), 3).getValues();
     const header = data[0];
     const idCol = header.indexOf("Field ID");
     const valCol = header.indexOf("Value");
     for (let r = 1; r < data.length; r++) {
       if (String(data[r][idCol]).trim() === "_updated") {
         sh.getRange(r + 1, valCol + 1).setValue(new Date().toISOString());
         break;
       }
     }
   }
   ```

3. That's it — `onEdit` is a simple trigger that runs automatically (no manual
   authorization needed for basic edits). Now every score change refreshes the
   `_updated` cell, and the page shows it within ~30s.

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

**A team name is cut off / too long.**
- Knockout name fields auto-shrink text to fit, but very long names in a small
  box can still clip. Use the short form (e.g. `S. KOREA`, `CZECHIA`) if needed.

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

