import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { turso } from "@/lib/turso";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await turso.execute(
    `SELECT id, fullName, srn, branch, year, email, phone, domains, experience, portfolioUrl, whyJoin, createdAt
     FROM applications
     ORDER BY createdAt DESC`
  );

  // sourceIp is intentionally excluded from the SELECT above so it never
  // ships to the client, matching the old Mongo projection.
  const submissions = result.rows.map((row) => ({
    ...row,
    domains: JSON.parse(String(row.domains || "[]")),
  }));

  return NextResponse.json({ ok: true, submissions });
}
