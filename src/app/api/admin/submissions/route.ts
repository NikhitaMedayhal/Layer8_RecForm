import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const submissions = await db
    .collection("applications")
    .find({}, { projection: { sourceIp: 0 } }) // don't ship raw IPs to the client
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({ ok: true, submissions });
}
