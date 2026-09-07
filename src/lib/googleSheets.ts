import { google } from "googleapis";
import type { ApplicationInput } from "./validation";

/**
 * Appends one row per submission to a Google Sheet, so the team always has a
 * live, human-browsable copy alongside the MongoDB record (the source of
 * truth). Uses a service account — never share the sheet with a personal
 * Google login credential from inside the app.
 *
 * Setup (see README):
 * 1. Create a Google Cloud service account, enable the Sheets API.
 * 2. Share the target spreadsheet with the service account's email as Editor.
 * 3. Put GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID
 *    in your env vars. GOOGLE_PRIVATE_KEY needs its \n escaped when stored
 *    as a single env var line (see .env.example).
 */

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !key) return null;

  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function appendToSheet(app: ApplicationInput & { createdAt: Date }) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const auth = getAuth();

  if (!sheetId || !auth) {
    // Sheets sync is optional — if it's not configured, skip it silently.
    // The submission is still safely stored in MongoDB.
    console.warn("[googleSheets] Skipping sync — GOOGLE_SHEET_ID or service account env vars not set.");
    return;
  }

  const sheets = google.sheets({ version: "v4", auth });

  const row = [
    app.createdAt.toISOString(),
    app.fullName,
    app.srn,
    app.branch,
    app.year,
    app.email,
    app.phone,
    app.domains.join(", "),
    app.experience || "",
    app.portfolioUrl || "",
    app.whyJoin,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "Submissions!A:K",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}
