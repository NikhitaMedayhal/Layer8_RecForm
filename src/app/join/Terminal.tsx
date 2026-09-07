"use client";

import { useState, useRef, useEffect } from "react";

type Line = { type: "input" | "output"; text: string };

const MISSION = `layer8 exists because the human is always the weakest — and
strongest — link in any system. we train people to think like
attackers so they can build like defenders.`;

function buildOutput(raw: string, onScrollToForm: () => void): string[] {
  const cmd = raw.trim();
  const [base, ...rest] = cmd.split(/\s+/);
  const arg = rest.join(" ");

  switch (base) {
    case "":
      return [];
    case "help":
      return [
        "available commands:",
        "help              show available commands",
        "ls                list sections",
        "whoami            identify the current user",
        "cat mission.txt   print the layer8 mission",
        "apply             jump to the application form",
        "clear             clear terminal output",
      ];
    case "ls":
      if (arg === "domains/" || arg === "domains") {
        return ["tech  marketing  design  events"];
      }
      return ["domains/   mission.txt   team/   apply"];
    case "whoami":
      return ["a prospective member — run `apply` when you're ready"];
    case "pwd":
      return ["~/layer8/join"];
    case "cat":
      if (arg === "mission.txt") return MISSION.split("\n");
      return [`cat: ${arg || "(no file)"}: No such file`];
    case "apply":
      onScrollToForm();
      return ["opening application form..."];
    case "clear":
      return ["__CLEAR__"];
    default:
      return [`command not found: ${base} — try 'help'`];
  }
}

export default function Terminal({ onScrollToForm }: { onScrollToForm: () => void }) {
  const [lines, setLines] = useState<Line[]>([
    { type: "output", text: "$ ls domains/" },
    { type: "output", text: "tech  marketing  design  events" },
    { type: "output", text: "$ help" },
    { type: "output", text: "available commands:" },
    { type: "output", text: "help              show available commands" },
    { type: "output", text: "ls                list sections" },
    { type: "output", text: "whoami            identify the current user" },
    { type: "output", text: "cat mission.txt   print the layer8 mission" },
    { type: "output", text: "apply             jump to the application form" },
    { type: "output", text: "clear             clear terminal output" },
  ]);
  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [lines]);

  function runCommand(e: React.FormEvent) {
    e.preventDefault();
    const cmd = input;
    const output = buildOutput(cmd, onScrollToForm);

    if (output[0] === "__CLEAR__") {
      setLines([]);
    } else {
      setLines((prev) => [
        ...prev,
        { type: "input", text: cmd },
        ...output.map((text) => ({ type: "output" as const, text })),
      ]);
    }
    setInput("");
  }

  return (
    <div className="term" onClick={() => inputRef.current?.focus()}>
      <div className="term-bar">
        <span className="term-dot" /><span className="term-dot" /><span className="term-dot" />
        <span style={{ marginLeft: "0.6rem", fontSize: "0.72rem", color: "var(--fg-faint)" }}>
          layer8 — ~
        </span>
      </div>
      <div ref={bodyRef} className="term-body" style={{ maxHeight: "22rem", overflowY: "auto" }}>
        {lines.map((l, i) => (
          <div key={i} className={l.type === "input" ? "" : "muted"}>
            {l.type === "input" ? <><span className="prompt">$</span> {l.text}</> : l.text}
          </div>
        ))}
        <form onSubmit={runCommand} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span className="prompt">$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-label="Terminal command input"
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--fg)",
              fontFamily: "inherit",
              fontSize: "inherit",
              flex: 1,
            }}
          />
        </form>
      </div>
      <div style={{ padding: "0.5rem 1.2rem 0.8rem", fontSize: "0.7rem", color: "var(--fg-faint)" }}>
        try: help · cat mission.txt · apply
      </div>
    </div>
  );
}
