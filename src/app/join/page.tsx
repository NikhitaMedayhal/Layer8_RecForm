"use client";

import { useState, useRef } from "react";
import Terminal from "./Terminal";

const DOMAINS = [
  { id: "marketing", label: "marketing" },
  { id: "media", label: "media" },
  { id: "design", label: "design" },
  { id: "tech", label: "tech" },
  { id: "events", label: "events" },
] as const;

const MAX_DOMAINS = 2;

const DOMAIN_QUESTIONS = {
  marketing: [
    {
      id: "marketingWhy",
      label: "Why do you want to join the Marketing team of Layer8?",
      type: "textarea",
      required: true,
    },
    {
      id: "marketingExperience",
      label:
        "Do you have prior experience in marketing? If yes, explain briefly (no experience is also fine).",
      type: "textarea",
      required: true,
    },
    {
      id: "marketingReach",
      label: "How good is your reach across the college?",
      type: "scale",
      required: true,
    },
    {
      id: "marketingCreative",
      label:
        "What’s the most creative or unconventional way you’ve promoted something in the past?",
      type: "textarea",
      required: true,
    },
    {
      id: "marketingWhatsapp",
      label:
        "A few tech events have already happened in college, similarly draw up a WhatsApp blast for our Project Expo (include placeholder details).",
      type: "textarea",
      required: true,
    },
    {
      id: "marketingInstagram",
      label: "Give your Instagram handle",
      type: "text",
      required: true,
    },
    {
      id: "marketingCtf",
      label:
        "Imagine Layer8 is hosting a CTF, but registrations are very low. What steps would you take in the next 48 hours to increase participation?",
      type: "textarea",
      required: true,
    },
  ],

  media: [
    {
      id: "mediaWhy",
      label: "Why do you want to join the Media team?",
      type: "textarea",
      required: true,
    },
    {
      id: "mediaExperience",
      label:
        "Do you have prior experience in photography, videography, or content creation? If yes, explain briefly.",
      type: "textarea",
      required: true,
    },
    {
      id: "mediaPortfolio",
      label:
        "If you are a video editor please upload your portfolio or link to some cool edits you have made. (Please use proper permissions so that we actually see your portfolio!)",
      type: "text",
      required: false,
    },
    {
      id: "mediaIdeas",
      label: "Pitch a few Instagram post/reel ideas for our club.",
      type: "textarea",
      required: true,
    },
    {
      id: "mediaInstagram",
      label: "Give your Instagram handle",
      type: "text",
      required: true,
    },
    {
      id: "mediaTrends",
      label:
        "On a scale of 1–10, how good are you at memes and current trends?",
      type: "scale",
      required: true,
    },
    {
      id: "mediaEngagement",
      label:
        "Imagine you’re covering one of our club’s events, but engagement on social media is low. What’s your plan to boost reach and engagement within 48 hours?",
      type: "textarea",
      required: true,
    },
  ],

  design: [
    {
      id: "designWhy",
      label: "Why do you want to join the Design team?",
      type: "textarea",
      required: true,
    },
    {
      id: "designExperience",
      label:
        "Do you have prior experience in design? (Graphic design, UI/UX, poster making, video editing, etc.)",
      type: "textarea",
      required: true,
    },
    {
      id: "designPortfolio",
      label:
        "Link to your design portfolio (if you upload a Google Drive link make sure you provide necessary permissions to view it)",
      type: "text",
      required: true,
    },
  ],
} as const;

const YEARS = ["1", "2", "3", "4"];
const CTF_SCALE = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

type FormState = {
  fullName: string;
  srn: string;
  branch: string;
  year: string;
  email: string;
  phone: string;
  domains: string[];
  domainAnswers: Record<string, string>;
  experience: string;
  portfolioUrl: string;
  whyJoin: string;
  // Tech-domain-only questions
  techCyberExperience: string;
  techLanguage: string;
  techWhyDomain: string;
  techPriorExperience: string;
  techCtfParticipated: string;
  techCtfOther: string;
  techCtfConfidence: string;
  techGithub: string;
  techLinkedin: string;
  techProject: string;
  // Events-domain-only questions
  eventsWhyJoin: string;
  eventsPriorExperience: string;
  eventsPlanSteps: string;
  eventsOrientationIdeas: string;
  eventsExcites: string;
  feedback: string;
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
  domainAnswers: {},
  experience: "",
  portfolioUrl: "",
  whyJoin: "",
  techCyberExperience: "",
  techLanguage: "",
  techWhyDomain: "",
  techPriorExperience: "",
  techCtfParticipated: "",
  techCtfOther: "",
  techCtfConfidence: "",
  techGithub: "",
  techLinkedin: "",
  techProject: "",
  eventsWhyJoin: "",
  eventsPriorExperience: "",
  eventsPlanSteps: "",
  eventsOrientationIdeas: "",
  eventsExcites: "",
  feedback: "",
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
    setForm((f) => {
      const alreadySelected = f.domains.includes(id);

      if (alreadySelected) {
        return {
          ...f,
          domains: f.domains.filter((d) => d !== id),
        };
      }

      if (f.domains.length >= MAX_DOMAINS) {
        return f;
      }

      return {
        ...f,
        domains: [...f.domains, id],
      };
    });

    setErrors((e) => ({
      ...e,
      domains: "",
    }));
  }

  function updateDomainAnswer(id: string, value: string) {
    setForm((f) => ({
      ...f,
      domainAnswers: {
        ...f.domainAnswers,
        [id]: value,
      },
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
            <span className="term-dot" />
            <span className="term-dot" />
            <span className="term-dot" />
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
          <h1
            className="font-display"
            style={{ fontSize: "clamp(2.2rem, 6vw, 4rem)", lineHeight: 0.98, marginTop: "0.6rem" }}
          >
            join layer8
          </h1>
          <p style={{ marginTop: "1.1rem", maxWidth: "34rem" }}>
            Tell us where you'd like to break things. No prior CTF experience required — curiosity
            and a willingness to get stuck matter more.
          </p>

          <div className="card" style={{ marginTop: "1.75rem", maxWidth: "34rem" }}>
            <p className="tag">why join</p>
            <ul
              style={{
                margin: "0.9rem 0 0",
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              {[
                "Learn by breaking things, not just reading about them",
                "Weekly CTFs across web, crypto, reversing, and pwn",
                "Work alongside people who'll actually push you",
                "Real, portfolio-worthy write-ups and projects",
                "No prior experience needed — just curiosity",
              ].map((point) => (
                <li
                  key={point}
                  style={{ display: "flex", gap: "0.6rem", color: "var(--fg-dim)", fontSize: "0.88rem" }}
                >
                  <span style={{ color: "var(--accent)" }}>&gt;</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            className="btn btn-solid"
            style={{ marginTop: "1.75rem" }}
            onClick={scrollToForm}
          >
            &gt; apply_now
          </button>
        </div>

        <Terminal onScrollToForm={scrollToForm} />
      </div>

      <hr className="rule" style={{ margin: "3rem 0 2.5rem" }} />

      <div ref={formRef} className="narrow" style={{ marginInline: "auto" }}>
        <form onSubmit={handleSubmit} noValidate>
          {/* Honeypot */}
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
            <input
              id="fullName"
              type="text"
              required
              maxLength={100}
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
            />
            {errors.fullName && <span className="error">{errors.fullName}</span>}
          </div>

          <div className={`field ${errors.srn ? "has-error" : ""}`}>
            <label htmlFor="srn">SRN</label>
            <input
              id="srn"
              type="text"
              required
              maxLength={20}
              value={form.srn}
              onChange={(e) => update("srn", e.target.value)}
            />
            {errors.srn && <span className="error">{errors.srn}</span>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className={`field ${errors.branch ? "has-error" : ""}`}>
              <label htmlFor="branch">Branch</label>
              <input
                id="branch"
                type="text"
                required
                maxLength={60}
                value={form.branch}
                onChange={(e) => update("branch", e.target.value)}
              />
              {errors.branch && <span className="error">{errors.branch}</span>}
            </div>
            <div className={`field ${errors.year ? "has-error" : ""}`}>
              <label htmlFor="year">Year</label>
              <select
                id="year"
                required
                value={form.year}
                onChange={(e) => update("year", e.target.value)}
              >
                <option value="" disabled>select</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              {errors.year && <span className="error">{errors.year}</span>}
            </div>
          </div>

          <div className={`field ${errors.email ? "has-error" : ""}`}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              maxLength={120}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>

          <div className={`field ${errors.phone ? "has-error" : ""}`}>
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              type="tel"
              required
              maxLength={15}
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
            {errors.phone && <span className="error">{errors.phone}</span>}
          </div>

          <div className={`field ${errors.domains ? "has-error" : ""}`}>
            <label>Domains you're drawn to</label>
            <span className="hint">Pick up to {MAX_DOMAINS}</span>
            <div className="checkbox-grid">
              {DOMAINS.map((d) => {
                const checked = form.domains.includes(d.id);
                const disabled = !checked && form.domains.length >= MAX_DOMAINS;
                return (
                  <label
                    key={d.id}
                    className={`chip-check ${disabled ? "chip-check-disabled" : ""}`}
                    style={{
                      opacity: disabled ? 0.45 : 1,
                      cursor: disabled ? "not-allowed" : "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleDomain(d.id)}
                    />
                    {d.label}
                  </label>
                );
              })}
            </div>
            {errors.domains && <span className="error">{errors.domains}</span>}
          </div>

          {/* Dynamic questions for marketing, media, design */}
          {form.domains.map((domain) => {
            const questions = DOMAIN_QUESTIONS[domain as keyof typeof DOMAIN_QUESTIONS];
            if (!questions) return null;

            return (
              <div
                key={domain}
                className="card"
                style={{
                  marginBottom: "1.75rem",
                  borderColor: "var(--accent)",
                }}
              >
                <p className="tag">{domain} questions, check out your roles and responsibilities using our terminal!</p>
                <p
                  className="hint"
                  style={{
                    marginTop: "0.6rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  answer the questions below for the {domain} domain
                </p>

                {questions.map((question) => (
                  <div className="field" key={question.id}>
                    <label htmlFor={question.id}>
                      {question.label}
                      {question.required && " *"}
                    </label>

                    {question.type === "scale" ? (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(10, minmax(0, 1fr))",
                          gap: "0.4rem",
                          marginTop: "0.5rem",
                        }}
                      >
                        {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((number) => (
                          <label
                            key={number}
                            className="chip-check"
                            style={{
                              justifyContent: "center",
                              padding: "0.7rem 0.2rem",
                            }}
                          >
                            <input
                              type="radio"
                              name={question.id}
                              value={number}
                              checked={form.domainAnswers[question.id] === number}
                              onChange={(e) => updateDomainAnswer(question.id, e.target.value)}
                            />
                            {number}
                          </label>
                        ))}
                      </div>
                    ) : question.type === "textarea" ? (
                      <textarea
                        id={question.id}
                        required={question.required}
                        maxLength={1500}
                        value={form.domainAnswers[question.id] || ""}
                        onChange={(e) => updateDomainAnswer(question.id, e.target.value)}
                      />
                    ) : (
                      <input
                        id={question.id}
                        type="text"
                        required={question.required}
                        maxLength={500}
                        value={form.domainAnswers[question.id] || ""}
                        onChange={(e) => updateDomainAnswer(question.id, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            );
          })}

          {/* Tech Domain Section */}
          {form.domains.includes("tech") && (
            <div className="card" style={{ margin: "0 0 1.5rem", padding: "1.1rem 1.2rem" }}>
              <p className="tag">tech domain questions, check out your roles and responsibilities our terminal!</p>

              <div className={`field ${errors.techCyberExperience ? "has-error" : ""}`} style={{ marginTop: "1rem" }}>
                <label>Do you have any prior experience in cybersecurity?</label>
                <div className="checkbox-grid">
                  {[["yes", "Yes"], ["no", "No"]].map(([value, label]) => (
                    <label key={value} className="chip-check">
                      <input
                        type="radio"
                        name="techCyberExperience"
                        checked={form.techCyberExperience === value}
                        onChange={() => update("techCyberExperience", value)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {errors.techCyberExperience && <span className="error">{errors.techCyberExperience}</span>}
              </div>

              <div className={`field ${errors.techLanguage ? "has-error" : ""}`}>
                <label htmlFor="techLanguage">Which language can you code in?</label>
                <input
                  id="techLanguage"
                  type="text"
                  maxLength={200}
                  value={form.techLanguage}
                  onChange={(e) => update("techLanguage", e.target.value)}
                />
                {errors.techLanguage && <span className="error">{errors.techLanguage}</span>}
              </div>

              <div className={`field ${errors.techWhyDomain ? "has-error" : ""}`}>
                <label htmlFor="techWhyDomain">Why do you want to join this domain?</label>
                <textarea
                  id="techWhyDomain"
                  maxLength={1500}
                  value={form.techWhyDomain}
                  onChange={(e) => update("techWhyDomain", e.target.value)}
                />
                {errors.techWhyDomain && <span className="error">{errors.techWhyDomain}</span>}
              </div>

              <div className={`field ${errors.techPriorExperience ? "has-error" : ""}`}>
                <label htmlFor="techPriorExperience">
                  Do you have prior experience in tech (coding, web dev, hardware, cybersecurity, AI/ML, etc.)? If yes, explain briefly.
                </label>
                <textarea
                  id="techPriorExperience"
                  maxLength={1500}
                  value={form.techPriorExperience}
                  onChange={(e) => update("techPriorExperience", e.target.value)}
                />
                {errors.techPriorExperience && <span className="error">{errors.techPriorExperience}</span>}
              </div>

              <div className={`field ${errors.techCtfParticipated ? "has-error" : ""}`}>
                <label>Have you participated in any CTFs?</label>
                <div className="checkbox-grid">
                  {[["yes", "Yes"], ["no", "No"], ["other", "Other"]].map(([value, label]) => (
                    <label key={value} className="chip-check">
                      <input
                        type="radio"
                        name="techCtfParticipated"
                        checked={form.techCtfParticipated === value}
                        onChange={() => update("techCtfParticipated", value)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {form.techCtfParticipated === "other" && (
                  <input
                    type="text"
                    maxLength={300}
                    placeholder="please specify"
                    style={{ marginTop: "0.4rem" }}
                    value={form.techCtfOther}
                    onChange={(e) => update("techCtfOther", e.target.value)}
                  />
                )}
                {errors.techCtfParticipated && <span className="error">{errors.techCtfParticipated}</span>}
              </div>

              <div className={`field ${errors.techCtfConfidence ? "has-error" : ""}`}>
                <label>On a scale of 1–10, how confident are you in making CTF challenges?</label>
                <span className="hint">1 being the least confidence and 10 being the most</span>
                <div className="checkbox-grid" style={{ gridTemplateColumns: "repeat(10, minmax(2.4rem, 1fr))" }}>
                  {CTF_SCALE.map((n) => (
                    <label key={n} className="chip-check" style={{ justifyContent: "center" }}>
                      <input
                        type="radio"
                        name="techCtfConfidence"
                        checked={form.techCtfConfidence === n}
                        onChange={() => update("techCtfConfidence", n)}
                      />
                      {n}
                    </label>
                  ))}
                </div>
                {errors.techCtfConfidence && <span className="error">{errors.techCtfConfidence}</span>}
              </div>

              <div className={`field ${errors.techGithub ? "has-error" : ""}`}>
                <label htmlFor="techGithub">GitHub profile (NA if none)</label>
                <input
                  id="techGithub"
                  type="text"
                  maxLength={300}
                  value={form.techGithub}
                  onChange={(e) => update("techGithub", e.target.value)}
                />
                {errors.techGithub && <span className="error">{errors.techGithub}</span>}
              </div>

              <div className={`field ${errors.techLinkedin ? "has-error" : ""}`}>
                <label htmlFor="techLinkedin">LinkedIn profile (NA if none)</label>
                <input
                  id="techLinkedin"
                  type="text"
                  maxLength={300}
                  value={form.techLinkedin}
                  onChange={(e) => update("techLinkedin", e.target.value)}
                />
                {errors.techLinkedin && <span className="error">{errors.techLinkedin}</span>}
              </div>

              <div className={`field ${errors.techProject ? "has-error" : ""}`} style={{ marginBottom: 0 }}>
                <label htmlFor="techProject">
                  Share a project, hackathon, or coding challenge you've worked on that you're proud of. (Include a link with proper permissions if you have one!)
                </label>
                <textarea
                  id="techProject"
                  maxLength={1500}
                  value={form.techProject}
                  onChange={(e) => update("techProject", e.target.value)}
                />
                {errors.techProject && <span className="error">{errors.techProject}</span>}
              </div>
            </div>
          )}

          {/* Events Domain Section */}
          {form.domains.includes("events") && (
            <div className="card" style={{ margin: "0 0 1.5rem", padding: "1.1rem 1.2rem" }}>
              <p className="tag">events domain questions, check out your roles and responsibilities using our terminal</p>

              <div className={`field ${errors.eventsWhyJoin ? "has-error" : ""}`} style={{ marginTop: "1rem" }}>
                <label htmlFor="eventsWhyJoin">Why do you want to join the Events &amp; Ops team?</label>
                <textarea
                  id="eventsWhyJoin"
                  maxLength={1500}
                  value={form.eventsWhyJoin}
                  onChange={(e) => update("eventsWhyJoin", e.target.value)}
                />
                {errors.eventsWhyJoin && <span className="error">{errors.eventsWhyJoin}</span>}
              </div>

              <div className={`field ${errors.eventsPriorExperience ? "has-error" : ""}`}>
                <label htmlFor="eventsPriorExperience">
                  Do you have prior experience organizing or managing events (college fests, workshops, meetups, etc.)? If yes, explain briefly.
                </label>
                <textarea
                  id="eventsPriorExperience"
                  maxLength={1500}
                  value={form.eventsPriorExperience}
                  onChange={(e) => update("eventsPriorExperience", e.target.value)}
                />
                {errors.eventsPriorExperience && <span className="error">{errors.eventsPriorExperience}</span>}
              </div>

              <div className={`field ${errors.eventsPlanSteps ? "has-error" : ""}`}>
                <label htmlFor="eventsPlanSteps">
                  Walk us through the steps you'd follow to plan and execute an event from start to finish.
                </label>
                <textarea
                  id="eventsPlanSteps"
                  maxLength={1500}
                  value={form.eventsPlanSteps}
                  onChange={(e) => update("eventsPlanSteps", e.target.value)}
                />
                {errors.eventsPlanSteps && <span className="error">{errors.eventsPlanSteps}</span>}
              </div>

              <div className={`field ${errors.eventsOrientationIdeas ? "has-error" : ""}`}>
                <label htmlFor="eventsOrientationIdeas">
                  Suggest a few activities to conduct on orientation day to make juniors interested in the club.
                </label>
                <textarea
                  id="eventsOrientationIdeas"
                  maxLength={1500}
                  value={form.eventsOrientationIdeas}
                  onChange={(e) => update("eventsOrientationIdeas", e.target.value)}
                />
                {errors.eventsOrientationIdeas && <span className="error">{errors.eventsOrientationIdeas}</span>}
              </div>

              <div className={`field ${errors.eventsExcites ? "has-error" : ""}`} style={{ marginBottom: 0 }}>
                <label htmlFor="eventsExcites">
                  What excites you about event management, and why do you want to try it out in our club?
                </label>
                <textarea
                  id="eventsExcites"
                  maxLength={1500}
                  value={form.eventsExcites}
                  onChange={(e) => update("eventsExcites", e.target.value)}
                />
                {errors.eventsExcites && <span className="error">{errors.eventsExcites}</span>}
              </div>
            </div>
          )}

          <div className={`field ${errors.feedback ? "has-error" : ""}`}>
            <label htmlFor="feedback">
              If you have any feedback, inputs, or suggestions regarding the club or events or anything in general, please share them below
            </label>
            <textarea
              id="feedback"
              required
              maxLength={1500}
              value={form.feedback}
              onChange={(e) => update("feedback", e.target.value)}
            />
            {errors.feedback && <span className="error">{errors.feedback}</span>}
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