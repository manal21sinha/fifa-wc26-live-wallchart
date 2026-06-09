// ── Wall chart configuration ───────────────────────────────────────────────
// Paste your Google Sheet ID below (the long string in the sheet URL between
// /d/ and /edit), then save & commit. Nothing else needs changing.
//
//   https://docs.google.com/spreadsheets/d/THIS_PART_IS_THE_ID/edit#gid=0
//
window.CHART_CONFIG = {
  // REQUIRED: your sheet ID
  SHEET_ID: "1IG8kilzjLRnm-KC-k0aJP8J2bTeBwxgGa_mJrcVkpZs",

  // The tab name as shown on the sheet tab at the bottom (default "Scores").
  SHEET_NAME: "Scores",

  // Column header names in row 1 of your sheet (must match exactly).
  ID_COLUMN: "Field ID",
  VALUE_COLUMN: "Value",

  // How often viewers re-poll the sheet, in milliseconds.
  REFRESH_MS: 30000,
};
