import { getDb } from "@/lib/mongodb";
import SignOutButton from "./SignOutButton";
import ExportControls from "./ExportControls";

export const dynamic = "force-dynamic"; 

type Application = {
  _id: string;
  fullName: string;
  srn: string;
  branch: string;
  year: string;
  email: string;
  phone: string;
  domains: string[];
  portfolioUrl?: string;
  whyJoin: string;
  createdAt: string;
};

export default async function AdminPage() {
  const db = await getDb();
  const submissions = await db
    .collection("applications")
    .find({}, { projection: { sourceIp: 0 } })
    .sort({ createdAt: -1 })
    .toArray();

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
            </tr>
          </thead>
          <tbody>
            {submissions.map((s: any) => (
              <tr key={s._id.toString()}>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
