import * as XLSX from "xlsx";

type ApplicationDoc = {
  id: unknown;
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
  // Tech-domain-only questions — blank for applicants who didn't pick tech.
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
  // Events-domain-only questions — blank for applicants who didn't pick events.
  eventsWhyJoin?: string;
  eventsPriorExperience?: string;
  eventsPlanSteps?: string;
  eventsOrientationIdeas?: string;
  eventsExcites?: string;
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
    "Cybersecurity Experience": s.techCyberExperience || "",
    "Coding Language": s.techLanguage || "",
    "Why This Domain (tech)": s.techWhyDomain || "",
    "Prior Tech Experience": s.techPriorExperience || "",
    "CTF Participation": s.techCtfParticipated === "other" ? s.techCtfOther || "other" : s.techCtfParticipated || "",
    "CTF Confidence (1-10)": s.techCtfConfidence || "",
    GitHub: s.techGithub || "",
    LinkedIn: s.techLinkedin || "",
    "Project Highlight": s.techProject || "",
    "Why Join Events (events)": s.eventsWhyJoin || "",
    "Prior Event Experience": s.eventsPriorExperience || "",
    "Event Planning Steps": s.eventsPlanSteps || "",
    "Orientation Day Ideas": s.eventsOrientationIdeas || "",
    "What Excites (events)": s.eventsExcites || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

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
    { wch: 16 }, // Cybersecurity Experience
    { wch: 18 }, // Coding Language
    { wch: 40 }, // Why This Domain (tech)
    { wch: 40 }, // Prior Tech Experience
    { wch: 16 }, // CTF Participation
    { wch: 12 }, // CTF Confidence
    { wch: 30 }, // GitHub
    { wch: 30 }, // LinkedIn
    { wch: 50 }, // Project Highlight
    { wch: 40 }, // Why Join Events (events)
    { wch: 40 }, // Prior Event Experience
    { wch: 40 }, // Event Planning Steps
    { wch: 40 }, // Orientation Day Ideas
    { wch: 40 }, // What Excites (events)
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Applications");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
