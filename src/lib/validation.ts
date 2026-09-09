import { z } from "zod";

export const DOMAINS = ["tech", "marketing", "design", "events"] as const;

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

const baseSchema = z.object({
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
  domains: z.array(z.enum(DOMAINS)).min(1, "Pick at least one domain").max(2, "Pick at most 2 domains"),
  experience: cleanString(0, 1500).optional().or(z.literal("")),
  portfolioUrl: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || /^https?:\/\/.+/.test(v), "Must be a valid http(s) URL")
    .optional()
    .or(z.literal("")),
  whyJoin: cleanString(0, 1500).optional().or(z.literal("")),

  // Tech-domain-only questions — only required when domains includes "tech".
  techCyberExperience: z.enum(["yes", "no"]).optional().or(z.literal("")),
  techLanguage: cleanString(0, 200).optional().or(z.literal("")),
  techWhyDomain: cleanString(0, 1500).optional().or(z.literal("")),
  techPriorExperience: cleanString(0, 1500).optional().or(z.literal("")),
  techCtfParticipated: z.enum(["yes", "no", "other"]).optional().or(z.literal("")),
  techCtfOther: cleanString(0, 300).optional().or(z.literal("")),
  techCtfConfidence: z.enum(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]).optional().or(z.literal("")),
  techGithub: cleanString(0, 300).optional().or(z.literal("")),
  techLinkedin: cleanString(0, 300).optional().or(z.literal("")),
  techProject: cleanString(0, 1500).optional().or(z.literal("")),

  // Events-domain-only questions — only required when domains includes "events".
  eventsWhyJoin: cleanString(0, 1500).optional().or(z.literal("")),
  eventsPriorExperience: cleanString(0, 1500).optional().or(z.literal("")),
  eventsPlanSteps: cleanString(0, 1500).optional().or(z.literal("")),
  eventsOrientationIdeas: cleanString(0, 1500).optional().or(z.literal("")),
  eventsExcites: cleanString(0, 1500).optional().or(z.literal("")),

  // Honeypot — must arrive empty. Real users never see or fill this field.
  website: z.string().max(0, "").optional().or(z.literal("")),
});

// The tech questions above are only shown to applicants who pick "tech" as a
// domain, so they're only required in that case — everyone else can leave
// them blank.
const REQUIRED_IF_TECH: { field: keyof z.infer<typeof baseSchema>; message: string }[] = [
  { field: "techCyberExperience", message: "Let us know if you have cybersecurity experience" },
  { field: "techLanguage", message: "Tell us a language you can code in" },
  { field: "techWhyDomain", message: "Tell us why you want to join this domain" },
  { field: "techPriorExperience", message: "Tell us about your prior tech experience" },
  { field: "techCtfParticipated", message: "Let us know if you've participated in any CTFs" },
  { field: "techCtfConfidence", message: "Rate your confidence in making CTF challenges" },
  { field: "techGithub", message: "Enter your GitHub profile, or NA if none" },
  { field: "techLinkedin", message: "Enter your LinkedIn profile, or NA if none" },
  { field: "techProject", message: "Share a project you're proud of" },
];

// Same idea as the tech questions above, but for applicants who pick "events".
const REQUIRED_IF_EVENTS: { field: keyof z.infer<typeof baseSchema>; message: string }[] = [
  { field: "eventsWhyJoin", message: "Tell us why you want to join the Events & Ops team" },
  { field: "eventsPriorExperience", message: "Let us know about any prior event experience" },
  { field: "eventsPlanSteps", message: "Walk us through your event planning steps" },
  { field: "eventsOrientationIdeas", message: "Suggest a few orientation day activities" },
  { field: "eventsExcites", message: "Tell us what excites you about event management" },
];

export const applicationSchema = baseSchema.superRefine((data, ctx) => {
  if (data.domains.includes("tech")) {
    for (const { field, message } of REQUIRED_IF_TECH) {
      const value = data[field];
      if (typeof value !== "string" || value.trim() === "") {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message });
      }
    }

    if (data.techCtfParticipated === "other" && (data.techCtfOther ?? "").trim() === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["techCtfOther"], message: "Please specify" });
    }
  }

  if (data.domains.includes("events")) {
    for (const { field, message } of REQUIRED_IF_EVENTS) {
      const value = data[field];
      if (typeof value !== "string" || value.trim() === "") {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message });
      }
    }
  }
});

export type ApplicationInput = z.infer<typeof baseSchema>;
