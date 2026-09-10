import { NextResponse } from "next/server";
import { z } from "zod";
import { turso } from "@/lib/turso"; // Adjust if your export is named differently (e.g., db or client)
import { getClientIp } from "@/lib/getClientIp";

// 1. Zod Validation Schema
const applySchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  srn: z.string().min(1, "SRN is required").max(20),
  branch: z.string().min(1, "Branch is required").max(60),
  year: z.enum(["1", "2", "3", "4"]),
  email: z.string().email("Invalid email format").max(120),
  phone: z.string().min(10, "Phone is required").max(15),
  domains: z.array(z.enum(["marketing", "media", "design", "tech", "events"])).min(1).max(2),
  
  // FIX 1: Added domainAnswers to the schema
  domainAnswers: z.record(z.string(), z.string()).optional().default({}),
  
  experience: z.string().optional(),
  portfolioUrl: z.string().optional(),
  
  // FIX 2: Fallback to empty string so it passes the NOT NULL constraint in SQL
  whyJoin: z.string().optional().default(""), 

  // Tech Domain (Optional)
  techCyberExperience: z.string().optional(),
  techLanguage: z.string().optional(),
  techWhyDomain: z.string().optional(),
  techPriorExperience: z.string().optional(),
  techCtfParticipated: z.string().optional(),
  techCtfOther: z.string().optional(),
  techCtfConfidence: z.string().optional(),
  techGithub: z.string().optional(),
  techLinkedin: z.string().optional(),
  techProject: z.string().optional(),

  // Events Domain (Optional)
  eventsWhyJoin: z.string().optional(),
  eventsPriorExperience: z.string().optional(),
  eventsPlanSteps: z.string().optional(),
  eventsOrientationIdeas: z.string().optional(),
  eventsExcites: z.string().optional(),

  // Feedback & Queries (shown to every applicant, required)
  feedback: z.string().min(1, "Feedback is required").max(1500),

  // Honeypot field
  website: z.string().optional(), 
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Spam protection: if honeypot is filled, silently drop it and return success
    if (body.website) {
      return NextResponse.json({ ok: true });
    }

    // Validate request body
    const parsed = applySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { 
          ok: false, 
          error: "Validation failed", 
          details: { fieldErrors: parsed.error.flatten().fieldErrors } 
        },
        { status: 400 }
      );
    }

    const clean = parsed.data;
    const sourceIp = getClientIp(req) || "unknown";

    try {
      // 2. Database Insertion with exact argument ordering
      await turso.execute({
        sql: `
          INSERT INTO applications (
            fullName, srn, branch, year, email, phone, domains, domainAnswers,
            experience, portfolioUrl, whyJoin,
            techCyberExperience, techLanguage, techWhyDomain, techPriorExperience,
            techCtfParticipated, techCtfOther, techCtfConfidence, techGithub, techLinkedin, techProject,
            eventsWhyJoin, eventsPriorExperience, eventsPlanSteps, eventsOrientationIdeas, eventsExcites,
            feedback,
            sourceIp
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?,
            ?
          )
        `,
        args: [
          clean.fullName,
          clean.srn,
          clean.branch,
          clean.year,
          clean.email,
          clean.phone,
          JSON.stringify(clean.domains),
          
          // Fix 1 implementation
          JSON.stringify(clean.domainAnswers),
          
          clean.experience ?? null,
          clean.portfolioUrl ?? null,
          
          // Fix 2 implementation
          clean.whyJoin, 

          // Tech fields fallback to null instead of undefined
          clean.techCyberExperience ?? null,
          clean.techLanguage ?? null,
          clean.techWhyDomain ?? null,
          clean.techPriorExperience ?? null,
          clean.techCtfParticipated ?? null,
          clean.techCtfOther ?? null,
          clean.techCtfConfidence ?? null,
          clean.techGithub ?? null,
          clean.techLinkedin ?? null,
          clean.techProject ?? null,

          // Events fields fallback to null instead of undefined
          clean.eventsWhyJoin ?? null,
          clean.eventsPriorExperience ?? null,
          clean.eventsPlanSteps ?? null,
          clean.eventsOrientationIdeas ?? null,
          clean.eventsExcites ?? null,

          clean.feedback,

          sourceIp
        ],
      });

      return NextResponse.json({ ok: true });
      
    } catch (dbError: any) {
      // Handle Unique Constraint Violations safely
      const msg = dbError?.message || "";
      if (msg.includes("UNIQUE constraint failed: applications.email")) {
        return NextResponse.json(
          { ok: false, error: "An application with this email already exists." },
          { status: 400 }
        );
      }
      if (msg.includes("UNIQUE constraint failed: applications.srn")) {
        return NextResponse.json(
          { ok: false, error: "An application with this SRN already exists." },
          { status: 400 }
        );
      }

      console.error("Database Error:", dbError);
      return NextResponse.json(
        { ok: false, error: "Internal database error. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json(
      { ok: false, error: "Bad request or server error." },
      { status: 500 }
    );
  }
}