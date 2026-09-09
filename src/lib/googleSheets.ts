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
    // Tech-domain-only questions — blank for applicants who didn't pick tech.
    app.techCyberExperience || "",
    app.techLanguage || "",
    app.techWhyDomain || "",
    app.techPriorExperience || "",
    app.techCtfParticipated === "other" ? app.techCtfOther || "other" : app.techCtfParticipated || "",
    app.techCtfConfidence || "",
    app.techGithub || "",
    app.techLinkedin || "",
    app.techProject || "",
    // Events-domain-only questions — blank for applicants who didn't pick events.
    app.eventsWhyJoin || "",
    app.eventsPriorExperience || "",
    app.eventsPlanSteps || "",
    app.eventsOrientationIdeas || "",
    app.eventsExcites || "",
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "Submissions!A:Y",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}
