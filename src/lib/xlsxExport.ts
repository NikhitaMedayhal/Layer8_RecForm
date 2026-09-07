import * as XLSX from "xlsx";

type ApplicationDoc = {
  _id: unknown;
  fullName: string;
  srn: string;
  branch: string;
  year: string;
  email: string;
  phone: string;
  domains: string[];
  experience?: string;
  portfolioUrl?: string;
  whyJoin: string;
  createdAt: Date | string;
};

export function buildApplicationsWorkbook(submissions: ApplicationDoc[]): Buffer {
  const rows = submissions.map((s) => ({
    "Submitted At": new Date(s.createdAt).toLocaleString(),
    "Full Name": s.fullName,
    SRN: s.srn,
    Branch: s.branch,
    Year: s.year,
    Email: s.email,
    Phone: s.phone,
    Domains: Array.isArray(s.domains) ? s.domains.join(", ") : "",
    Experience: s.experience || "",
    Portfolio: s.portfolioUrl || "",
    "Why Join": s.whyJoin,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Reasonable column widths so it's readable without manual resizing.
  worksheet["!cols"] = [
    { wch: 18 }, // Submitted At
    { wch: 20 }, // Full Name
    { wch: 14 }, // SRN
    { wch: 14 }, // Branch
    { wch: 6 },  // Year
    { wch: 26 }, // Email
    { wch: 14 }, // Phone
    { wch: 22 }, // Domains
    { wch: 40 }, // Experience
    { wch: 30 }, // Portfolio
    { wch: 50 }, // Why Join
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Applications");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
