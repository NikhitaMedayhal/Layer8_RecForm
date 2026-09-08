import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { turso } from "@/lib/turso";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

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

  const placeholders = ids.map(() => "?").join(", ");
  const result = await turso.execute({
    sql: `DELETE FROM applications WHERE id IN (${placeholders})`,
    args: ids,
  });

  return NextResponse.json({ ok: true, deletedCount: Number(result.rowsAffected) });
}
