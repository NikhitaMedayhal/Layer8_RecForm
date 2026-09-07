import { z } from "zod";

export const DOMAINS = ["tech", "marketing", "design", "events"] as const;

// Strips control characters and angle brackets defense-in-depth-style.
// React already escapes text on render, so this isn't the only thing standing
// between us and stored XSS, but it keeps obviously-malicious payloads out of
// the DB and the synced spreadsheet (which other tools may render as HTML).
function clean(input: string): string {
  return input
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "")
    .trim();
}

const cleanString = (min: number, max: number) =>
  z
    .string()
    .transform(clean)
    .pipe(z.string().min(min).max(max));

export const applicationSchema = z.object({
  fullName: cleanString(2, 100),
  srn: cleanString(3, 20),
  branch: cleanString(2, 60),
  year: z.enum(["1", "2", "3", "4"]),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .max(120),
  phone: z
    .string()
    .transform(clean)
    .pipe(z.string().regex(/^[0-9+\-\s]{7,15}$/, "Enter a valid phone number")),
  domains: z.array(z.enum(DOMAINS)).min(1, "Pick at least one domain").max(8),
  experience: cleanString(0, 1500).optional().or(z.literal("")),
  portfolioUrl: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || /^https?:\/\/.+/.test(v), "Must be a valid http(s) URL")
    .optional()
    .or(z.literal("")),
  whyJoin: cleanString(20, 1500),
  // Honeypot — must arrive empty. Real users never see or fill this field.
  website: z.string().max(0, "").optional().or(z.literal("")),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
