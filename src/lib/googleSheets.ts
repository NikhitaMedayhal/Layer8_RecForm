import { google } from "googleapis";
import type { ApplicationInput } from "./validation";

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
