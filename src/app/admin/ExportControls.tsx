"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Stage = "idle" | "exporting" | "exported" | "deleting" | "done" | "error";

export default function ExportControls() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [exportedIds, setExportedIds] = useState<string[]>([]);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");

  async function handleExport() {
    setStage("exporting");
    setError("");
    try {
      const res = await fetch("/api/admin/export");
      if (!res.ok) throw new Error("Export failed.");

      const idsHeader = res.headers.get("X-Exported-Ids") || "[]";
      const ids: string[] = JSON.parse(idsHeader);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `layer8-applications-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setExportedIds(ids);
      setStage("exported");
    } catch (err) {
      setError("Could not generate the export. Try again.");
      setStage("error");
    }
  }

  async function handleDelete() {
    setStage("deleting");
    setError("");
    try {
      const res = await fetch("/api/admin/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: exportedIds }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Delete failed.");

      setStage("done");
      router.refresh();
    } catch (err) {
      setError("Could not delete the exported records. They're still safe in MongoDB.");
      setStage("error");
    }
  }

  const isDeleting = stage === "deleting";

  return (
    <div className="card" style={{ marginBottom: "1.5rem" }}>
      <p className="tag">export &amp; clean up</p>
      <p style={{ marginTop: "0.6rem", fontSize: "0.85rem" }}>
        Downloads every submission as an .xlsx file. Once you've confirmed the download looks
        right, you can permanently delete exactly those records from MongoDB.
      </p>

      <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" className="btn btn-solid" onClick={handleExport} disabled={stage === "exporting"}>
          {stage === "exporting" ? "> exporting..." : "> export_to_excel"}
        </button>

        {stage === "exported" && (
          <span style={{ fontSize: "0.82rem", color: "var(--fg-dim)" }}>
            {exportedIds.length} record{exportedIds.length === 1 ? "" : "s"} downloaded.
          </span>
        )}
      </div>

      {(stage === "exported" || stage === "deleting") && exportedIds.length > 0 && (
        <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border)" }}>
          <p style={{ fontSize: "0.85rem", color: "var(--danger)" }}>
            This permanently deletes the {exportedIds.length} record{exportedIds.length === 1 ? "" : "s"} you
            just downloaded from MongoDB. This can't be undone — make sure the .xlsx file actually
            opened and looks correct first.
          </p>
          <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder='type "delete" to confirm'
              style={{
                background: "var(--bg-3)",
                border: "1px solid var(--border)",
                color: "var(--fg)",
                padding: "0.5rem 0.7rem",
                fontFamily: "inherit",
                fontSize: "0.85rem",
                width: "14rem",
              }}
            />
            <button
              type="button"
              className="btn"
              style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
              disabled={confirmText.trim().toLowerCase() !== "delete" || isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? "> deleting..." : "> delete_from_mongo"}
            </button>
          </div>
        </div>
      )}

      {stage === "done" && (
        <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "var(--fg-dim)" }}>
          Deleted. The exported .xlsx file on your computer is now the only copy of those records.
        </p>
      )}

      {error && <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}
