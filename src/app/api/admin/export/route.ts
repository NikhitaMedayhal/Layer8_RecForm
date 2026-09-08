import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { turso } from "@/lib/turso";
import { buildApplicationsWorkbook } from "@/lib/xlsxExport";

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

  const submissions: Array<Record<string, unknown> & { id: unknown; domains: string[] }> =
    result.rows.map((row) => {
      const plain = row as unknown as Record<string, unknown>;
      return {
        ...plain,
        id: plain.id,
        domains: JSON.parse(String(plain.domains || "[]")),
      };
    });

  const buffer = buildApplicationsWorkbook(submissions as any);

  // Send back exactly which ids were included in this export, so the
  // client can later ask to delete precisely these — not "everything in
  // the database right now", which could include submissions that arrived
  // after this export was generated.
  const exportedIds = submissions.map((s) => String(s.id));

  const filename = `layer8-applications-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Exported-Ids": JSON.stringify(exportedIds),
      "X-Exported-Count": String(exportedIds.length),
    },
  });
}
