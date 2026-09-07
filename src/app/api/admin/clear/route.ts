import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

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
  if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === "string")) {
    return NextResponse.json({ ok: false, error: "ids must be a non-empty array of strings." }, { status: 400 });
  }

  let objectIds: ObjectId[];
  try {
    objectIds = ids.map((id: string) => new ObjectId(id));
  } catch {
    return NextResponse.json({ ok: false, error: "One or more ids are not valid." }, { status: 400 });
  }

  const db = await getDb();
  const result = await db.collection("applications").deleteMany({ _id: { $in: objectIds } });

  return NextResponse.json({ ok: true, deletedCount: result.deletedCount });
}
