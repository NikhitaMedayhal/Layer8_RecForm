"use client";

import { useState } from "react";

type Stage = "idle" | "exporting" | "exported" | "error";

export default function ExportControls() {
  const [stage, setStage] = useState<Stage>("idle");
  const [count, setCount] = useState(0);
  const [error, setError] = useState("");

  async function handleExport() {
    setStage("exporting");
    setError("");
    try {
      const res = await fetch("/api/admin/export");
      if (!res.ok) throw new Error("Export failed.");

      const countHeader = res.headers.get("X-Exported-Count");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `layer8-applications-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setCount(countHeader ? Number(countHeader) : 0);
      setStage("exported");
    } catch (err) {
      setError("Could not generate the export. Try again.");
      setStage("error");
    }
  }

  return (
    <div className="card" style={{ marginBottom: "1.5rem" }}>
      <p className="tag">export</p>
      <p style={{ marginTop: "0.6rem", fontSize: "0.85rem" }}>
        Downloads every submission currently in the database as an .xlsx file. This is a copy —
        nothing is removed from the database.
      </p>

      <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" className="btn btn-solid" onClick={handleExport} disabled={stage === "exporting"}>
          {stage === "exporting" ? "> exporting..." : "> export_to_excel"}
        </button>

        {stage === "exported" && (
          <span style={{ fontSize: "0.82rem", color: "var(--fg-dim)" }}>
            {count} record{count === 1 ? "" : "s"} downloaded.
          </span>
        )}
      </div>

      {error && <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}