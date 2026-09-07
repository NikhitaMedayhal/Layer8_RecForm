import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { buildApplicationsWorkbook } from "@/lib/xlsxExport";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const submissions = await db
    .collection("applications")
    .find({}, { projection: { sourceIp: 0 } })
    .sort({ createdAt: -1 })
    .toArray();

  const buffer = buildApplicationsWorkbook(submissions as any);

  // Send back exactly which _ids were included in this export, so the
  // client can later ask to delete precisely these — not "everything in
  // Mongo right now", which could include submissions that arrived after
  // this export was generated.
  const exportedIds = submissions.map((s) => s._id.toString());

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
