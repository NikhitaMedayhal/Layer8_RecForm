import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { turso } from "@/lib/turso";
import { getClientIp } from "@/lib/getClientIp";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(req.headers);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request body." }, { status: 400 });
  }

  const ids = (body as any)?.ids;
  if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === "string" && id.length > 0)) {
    return NextResponse.json({ ok: false, error: "ids must be a non-empty array of strings." }, { status: 400 });
  }
  // Hard ceiling so a malformed/malicious client can't pass a huge array
  // and turn this into a resource-exhaustion vector.
  if (ids.length > 500) {
    return NextResponse.json({ ok: false, error: "Too many ids in one request (max 500)." }, { status: 400 });
  }

  const placeholders = ids.map(() => "?").join(", ");
  const result = await turso.execute({
    sql: `DELETE FROM applications WHERE id IN (${placeholders})`,
    args: ids,
  });

  const deletedCount = Number(result.rowsAffected);

  await turso.execute({
    sql: `INSERT INTO audit_log (actorEmail, action, detail, ip) VALUES (?, 'clear', ?, ?)`,
    args: [session.user.email, `Deleted ${deletedCount} row(s): ${ids.join(", ")}`, ip],
  });

  return NextResponse.json({ ok: true, deletedCount });
}
