import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { applicationSchema } from "@/lib/validation";
import { isRateLimited } from "@/lib/rateLimit";
import { appendToSheet } from "@/lib/googleSheets";

export const runtime = "nodejs"; // needed for the mongodb driver + tls

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Try again in a minute." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request body." }, { status: 400 });
  }

  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation failed.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Honeypot: humans never see/fill this field. If it's non-empty, a bot did.
  // Pretend success so the bot doesn't learn its request was rejected.
  if (data.website) {
    return NextResponse.json({ ok: true });
  }

  const { website, ...clean } = data;
  const record = { ...clean, createdAt: new Date(), sourceIp: ip };

  try {
    const db = await getDb();
    await db.collection("applications").insertOne(record);
  } catch (err) {
    console.error("[apply] Mongo insert failed:", err);
    return NextResponse.json(
      { ok: false, error: "Could not save your application. Please try again shortly." },
      { status: 500 }
    );
  }

  // Best-effort: the application is already safely stored, so a Sheets
  // hiccup shouldn't fail the whole request for the applicant.
  try {
    await appendToSheet(record);
  } catch (err) {
    console.error("[apply] Sheets sync failed (submission was still saved):", err);
  }

  return NextResponse.json({ ok: true });
}
