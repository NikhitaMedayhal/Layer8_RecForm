"use client";

import { useState, useRef } from "react";
import Terminal from "./Terminal";

const DOMAINS = [
  { id: "tech", label: "tech" },
  { id: "marketing", label: "marketing" },
  { id: "design", label: "design" },
  { id: "events", label: "events" },
];

const YEARS = ["1", "2", "3", "4"];

type FormState = {
  fullName: string;
  srn: string;
  branch: string;
  year: string;
  email: string;
  phone: string;
  domains: string[];
  experience: string;
  portfolioUrl: string;
  whyJoin: string;
  website: string; // honeypot
};

const initialState: FormState = {
  fullName: "",
  srn: "",
  branch: "",
  year: "",
  email: "",
  phone: "",
  domains: [],
  experience: "",
  portfolioUrl: "",
  whyJoin: "",
  website: "",
};

export default function JoinPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleDomain(id: string) {
    setForm((f) => ({
      ...f,
      domains: f.domains.includes(id) ? f.domains.filter((d) => d !== id) : [...f.domains, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setErrorMsg("");
    setStatus("submitting");

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.ok) {
        setStatus("success");
        return;
      }

      if (data.details?.fieldErrors) {
        const fieldErrors: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(data.details.fieldErrors)) {
          if (Array.isArray(msgs) && msgs.length) fieldErrors[key] = msgs[0] as string;
        }
        setErrors(fieldErrors);
      }
      setErrorMsg(data.error || "Something went wrong. Try again.");
      setStatus("error");
    } catch {
      setErrorMsg("Network error — check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <main className="wrap narrow" style={{ paddingBlock: "5rem" }}>
        <div className="term">
          <div className="term-bar">
            <span className="term-dot" /><span className="term-dot" /><span className="term-dot" />
          </div>
          <div className="term-body">
            <span className="prompt">$</span> ./submit_application<br />
            <span className="muted">[ok]</span> application received. we'll reach out over email.<br />
            <span className="prompt">$</span> <span className="cursor">&nbsp;</span>
          </div>
        </div>
        <a
          href="https://layer8ecc.vercel.app"
          className="btn btn-solid"
          style={{ marginTop: "1.75rem", display: "inline-block", textAlign: "center" }}
        >
          &gt; back_to_home
        </a>
      </main>
    );
  }
  return (
    <main className="wrap" style={{ paddingBlock: "4rem" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          gap: "2.5rem",
          alignItems: "start",
        }}
        className="hero-grid"
      >
        <div>
          <p className="kicker">// PES University — Electronic City Campus</p>
          <h1 className="font-display" style={{ fontSize: "clamp(2.2rem, 6vw, 4rem)", lineHeight: 0.98, marginTop: "0.6rem" }}>
            join layer8
          </h1>
          <p style={{ marginTop: "1.1rem", maxWidth: "34rem" }}>
            Tell us where you'd like to break things. No prior CTF experience required —
            curiosity and a willingness to get stuck matter more.
          </p>

          <div className="card" style={{ marginTop: "1.75rem", maxWidth: "34rem" }}>
            <p className="tag">why join</p>
            <ul style={{ margin: "0.9rem 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {[
                "Learn by breaking things, not just reading about them",
                "Weekly CTFs across web, crypto, reversing, and pwn",
                "Work alongside people who'll actually push you",
                "Real, portfolio-worthy write-ups and projects",
                "No prior experience needed — just curiosity",
              ].map((point) => (
                <li key={point} style={{ display: "flex", gap: "0.6rem", color: "var(--fg-dim)", fontSize: "0.88rem" }}>
                  <span style={{ color: "var(--accent)" }}>&gt;</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <button type="button" className="btn btn-solid" style={{ marginTop: "1.75rem" }} onClick={scrollToForm}>
            &gt; apply_now
          </button>
        </div>

        <Terminal onScrollToForm={scrollToForm} />
      </div>

      <hr className="rule" style={{ margin: "3rem 0 2.5rem" }} />

      <div ref={formRef} className="narrow" style={{ marginInline: "auto" }}>
      <form onSubmit={handleSubmit} noValidate>
        {/* Honeypot — hidden from real users via CSS, bots often fill any field they find */}
        <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
          <label htmlFor="website">Leave this field empty</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => update("website", e.target.value)}
          />
        </div>

        <div className={`field ${errors.fullName ? "has-error" : ""}`}>
          <label htmlFor="fullName">Full name</label>
          <input id="fullName" type="text" required maxLength={100}
            value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
          {errors.fullName && <span className="error">{errors.fullName}</span>}
        </div>

        <div className={`field ${errors.srn ? "has-error" : ""}`}>
          <label htmlFor="srn">SRN</label>
          <input id="srn" type="text" required maxLength={20}
            value={form.srn} onChange={(e) => update("srn", e.target.value)} />
          {errors.srn && <span className="error">{errors.srn}</span>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className={`field ${errors.branch ? "has-error" : ""}`}>
            <label htmlFor="branch">Branch</label>
            <input id="branch" type="text" required maxLength={60}
              value={form.branch} onChange={(e) => update("branch", e.target.value)} />
            {errors.branch && <span className="error">{errors.branch}</span>}
          </div>
          <div className={`field ${errors.year ? "has-error" : ""}`}>
            <label htmlFor="year">Year</label>
            <select id="year" required value={form.year} onChange={(e) => update("year", e.target.value)}>
              <option value="" disabled>select</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            {errors.year && <span className="error">{errors.year}</span>}
          </div>
        </div>

        <div className={`field ${errors.email ? "has-error" : ""}`}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required maxLength={120}
            value={form.email} onChange={(e) => update("email", e.target.value)} />
          {errors.email && <span className="error">{errors.email}</span>}
        </div>

        <div className={`field ${errors.phone ? "has-error" : ""}`}>
          <label htmlFor="phone">Phone</label>
          <input id="phone" type="tel" required maxLength={15}
            value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          {errors.phone && <span className="error">{errors.phone}</span>}
        </div>

        <div className={`field ${errors.domains ? "has-error" : ""}`}>
          <label>Domains you're drawn to</label>
          <div className="checkbox-grid">
            {DOMAINS.map((d) => (
              <label key={d.id} className="chip-check">
                <input type="checkbox" checked={form.domains.includes(d.id)}
                  onChange={() => toggleDomain(d.id)} />
                {d.label}
              </label>
            ))}
          </div>
          {errors.domains && <span className="error">{errors.domains}</span>}
        </div>

        <div className={`field ${errors.portfolioUrl ? "has-error" : ""}`}>
          <label htmlFor="portfolioUrl">Portfolio / GitHub / writeups link</label>
          <span className="hint">optional — a link is fine, no need to attach files</span>
          <input id="portfolioUrl" type="url" maxLength={300} placeholder="https://github.com/..."
            value={form.portfolioUrl} onChange={(e) => update("portfolioUrl", e.target.value)} />
          {errors.portfolioUrl && <span className="error">{errors.portfolioUrl}</span>}
        </div>

        <div className={`field ${errors.experience ? "has-error" : ""}`}>
          <label htmlFor="experience">Prior experience</label>
          <span className="hint">optional — CTFs, projects, courses, anything relevant</span>
          <textarea id="experience" maxLength={1500}
            value={form.experience} onChange={(e) => update("experience", e.target.value)} />
        </div>

        <div className={`field ${errors.whyJoin ? "has-error" : ""}`}>
          <label htmlFor="whyJoin">Why do you want to join?</label>
          <textarea id="whyJoin" required maxLength={1500}
            value={form.whyJoin} onChange={(e) => update("whyJoin", e.target.value)} />
          {errors.whyJoin && <span className="error">{errors.whyJoin}</span>}
        </div>

        {status === "error" && errorMsg && (
          <p style={{ color: "var(--danger)", fontSize: "0.85rem", marginBottom: "1rem" }}>{errorMsg}</p>
        )}

        <button type="submit" className="btn btn-solid" disabled={status === "submitting"}>
          {status === "submitting" ? "> submitting..." : "> submit_application"}
        </button>
      </form>
      </div>
    </main>
  );
}
