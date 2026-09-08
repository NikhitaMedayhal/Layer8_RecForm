import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/turso";
import { applicationSchema } from "@/lib/validation";
import { isRateLimited } from "@/lib/rateLimit";
import { appendToSheet } from "@/lib/googleSheets";

export const runtime = "nodejs";

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
  const createdAt = new Date();

  // Block resubmissions up front (fast path, clear error message).
  // The unique indexes on `email`/`srn` in schema.sql are the real
  // enforcement — this check just avoids hitting that as a raw DB error
  // in the common case.
  try {
    const existing = await turso.execute({
      sql: `SELECT id FROM applications WHERE email = ? OR srn = ? LIMIT 1`,
      args: [clean.email, clean.srn],
    });
    if (existing.rows.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "An application with this email or SRN has already been submitted.",
        },
        { status: 409 }
      );
    }
  } catch (err) {
    console.error("[apply] Duplicate check failed:", err);
    return NextResponse.json(
      { ok: false, error: "Could not save your application. Please try again shortly." },
      { status: 500 }
    );
  }

  try {
    await turso.execute({
      sql: `INSERT INTO applications
              (fullName, srn, branch, year, email, phone, domains, experience, portfolioUrl, whyJoin, sourceIp, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        clean.fullName,
        clean.srn,
        clean.branch,
        clean.year,
        clean.email,
        clean.phone,
        JSON.stringify(clean.domains),
        clean.experience || null,
        clean.portfolioUrl || null,
        clean.whyJoin,
        ip,
        createdAt.toISOString(),
      ],
    });
  } catch (err: any) {
    // Race condition: two identical submissions landed at nearly the same
    // time and both passed the check above. The unique index catches it here.
    const message = String(err?.message || "");
    if (message.includes("UNIQUE constraint failed")) {
      return NextResponse.json(
        {
          ok: false,
          error: "An application with this email or SRN has already been submitted.",
        },
        { status: 409 }
      );
    }
    console.error("[apply] Turso insert failed:", err);
    return NextResponse.json(
      { ok: false, error: "Could not save your application. Please try again shortly." },
      { status: 500 }
    );
  }
  // Best-effort: the application is already safely stored, so a Sheets
  // hiccup shouldn't fail the whole request for the applicant.
  try {
    await appendToSheet({ ...clean, createdAt });
  } catch (err) {
    console.error("[apply] Sheets sync failed (submission was still saved):", err);
  }

  return NextResponse.json({ ok: true });
}
