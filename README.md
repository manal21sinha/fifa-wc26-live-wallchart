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

The page fetches your sheet through Google's public **gviz CSV** endpoint
(`/gviz/tq?tqx=out:csv&sheet=Scores`). It's free, needs no API key, works from
a static host, and is requested with a cache-buster each cycle so updates show
up promptly. Values map to fields by the **Field ID** column.

> Note: Google may cache the CSV for a short time, so an edit can take a few
> tens of seconds beyond the refresh interval to appear. That's normal.

## Field id scheme (reference)

- Group scores: `group01_home_score`, `group01_away_score` … `group72_*`
  (home = left team in `X v Y`, away = right team).
- Knockout: `koNN_top_team`, `koNN_bottom_team`, `koNN_top_score`,
  `koNN_bottom_score` for `NN` = 01…32. `ko19` is the Final; `ko28` is the
  third-place play-off. You normally never need these — use the Description.
