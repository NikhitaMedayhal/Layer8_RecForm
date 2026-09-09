import { turso } from "@/lib/turso";
import SignOutButton from "./SignOutButton";
import ExportControls from "./ExportControls";

export const dynamic = "force-dynamic"; 

type Application = {
  id: string;
  fullName: string;
  srn: string;
  branch: string;
  year: string;
  email: string;
  phone: string;
  domains: string[];
  portfolioUrl?: string;
  whyJoin: string;
  techCyberExperience?: string;
  techLanguage?: string;
  techWhyDomain?: string;
  techPriorExperience?: string;
  techCtfParticipated?: string;
  techCtfOther?: string;
  techCtfConfidence?: string;
  techGithub?: string;
  techLinkedin?: string;
  techProject?: string;
  eventsWhyJoin?: string;
  eventsPriorExperience?: string;
  eventsPlanSteps?: string;
  eventsOrientationIdeas?: string;
  eventsExcites?: string;
  createdAt: string;
};

export default async function AdminPage() {
  const result = await turso.execute(
    `SELECT id, fullName, srn, branch, year, email, phone, domains, experience, portfolioUrl, whyJoin,
            techCyberExperience, techLanguage, techWhyDomain, techPriorExperience, techCtfParticipated,
            techCtfOther, techCtfConfidence, techGithub, techLinkedin, techProject,
            eventsWhyJoin, eventsPriorExperience, eventsPlanSteps, eventsOrientationIdeas, eventsExcites, createdAt
     FROM applications
     ORDER BY createdAt DESC`
  );
  const submissions = result.rows.map((row) => ({
    ...row,
    domains: JSON.parse(String(row.domains || "[]")),
  }));

  return (
    <main className="wrap" style={{ paddingBlock: "3rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <p className="kicker">// layer8 admin</p>
          <h1 className="font-display" style={{ fontSize: "1.9rem", marginTop: "0.4rem" }}>applications</h1>
        </div>
        <SignOutButton />
      </div>

      <p style={{ marginTop: "0.75rem" }}>
        {submissions.length} submission{submissions.length === 1 ? "" : "s"} — also synced live to the shared Google Sheet.
      </p>

      <hr className="rule" style={{ margin: "1.5rem 0" }} />

      <ExportControls />

      <div className="card" style={{ overflowX: "auto", padding: 0 }}>
        <table className="data">
          <thead>
            <tr>
              <th>Submitted</th>
              <th>Name</th>
              <th>SRN</th>
              <th>Branch / Yr</th>
              <th>Contact</th>
              <th>Domains</th>
              <th>Portfolio</th>
              <th>Why join</th>
              <th>Tech domain answers</th>
              <th>Events domain answers</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s: any) => (
              <tr key={String(s.id)}>
                <td>{new Date(s.createdAt).toLocaleString()}</td>
                <td>{s.fullName}</td>
                <td>{s.srn}</td>
                <td>{s.branch} / {s.year}</td>
                <td>{s.email}<br />{s.phone}</td>
                <td>{Array.isArray(s.domains) ? s.domains.join(", ") : ""}</td>
                <td>
                  {s.portfolioUrl ? (
                    <a href={s.portfolioUrl} target="_blank" rel="noopener noreferrer nofollow" style={{ color: "var(--accent)" }}>
                      link
                    </a>
                  ) : "—"}
                </td>
                <td style={{ maxWidth: "22rem" }}>{s.whyJoin}</td>
                <td style={{ maxWidth: "26rem", fontSize: "0.8rem" }}>
                  {Array.isArray(s.domains) && s.domains.includes("tech") ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      <span><strong>Cyber exp:</strong> {s.techCyberExperience || "—"}</span>
                      <span><strong>Language:</strong> {s.techLanguage || "—"}</span>
                      <span><strong>Why tech:</strong> {s.techWhyDomain || "—"}</span>
                      <span><strong>Prior tech exp:</strong> {s.techPriorExperience || "—"}</span>
                      <span>
                        <strong>CTFs:</strong>{" "}
                        {s.techCtfParticipated === "other"
                          ? s.techCtfOther || "other"
                          : s.techCtfParticipated || "—"}
                      </span>
                      <span><strong>CTF confidence:</strong> {s.techCtfConfidence || "—"}/10</span>
                      <span><strong>GitHub:</strong> {s.techGithub || "—"}</span>
                      <span><strong>LinkedIn:</strong> {s.techLinkedin || "—"}</span>
                      <span><strong>Project:</strong> {s.techProject || "—"}</span>
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td style={{ maxWidth: "26rem", fontSize: "0.8rem" }}>
                  {Array.isArray(s.domains) && s.domains.includes("events") ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      <span><strong>Why join:</strong> {s.eventsWhyJoin || "—"}</span>
                      <span><strong>Prior event exp:</strong> {s.eventsPriorExperience || "—"}</span>
                      <span><strong>Plan steps:</strong> {s.eventsPlanSteps || "—"}</span>
                      <span><strong>Orientation ideas:</strong> {s.eventsOrientationIdeas || "—"}</span>
                      <span><strong>Excites:</strong> {s.eventsExcites || "—"}</span>
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
