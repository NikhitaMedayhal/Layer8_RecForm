import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { turso } from "@/lib/turso";
import { buildApplicationsWorkbook } from "@/lib/xlsxExport";
import { getClientIp } from "@/lib/getClientIp";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await turso.execute(
    `SELECT id, fullName, srn, branch, year, email, phone, domains, experience, portfolioUrl, whyJoin,
            techCyberExperience, techLanguage, techWhyDomain, techPriorExperience, techCtfParticipated,
            techCtfOther, techCtfConfidence, techGithub, techLinkedin, techProject,
            eventsWhyJoin, eventsPriorExperience, eventsPlanSteps, eventsOrientationIdeas, eventsExcites, createdAt
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

  const exportedIds = submissions.map((s) => String(s.id));

  const filename = `layer8-applications-${new Date().toISOString().slice(0, 10)}.xlsx`;

  await turso.execute({
    sql: `INSERT INTO audit_log (actorEmail, action, detail, ip) VALUES (?, 'export', ?, ?)`,
    args: [session.user.email, `Exported ${exportedIds.length} row(s)`, getClientIp(req.headers)],
  });

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
