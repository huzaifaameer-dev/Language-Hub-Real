"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { GhostButton } from "@/components/admin/ui";

/**
 * Downloads one whitelisted CSV dataset from /api/admin/export.
 * The route enforces the admin cookie; this button only handles the file
 * transfer and keeps the filename the server chose.
 */
export function ExportCsvButton({
  dataset,
  label = "Export CSV",
}: {
  dataset: "registrations" | "demos" | "leads" | "feedback";
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/export?dataset=${dataset}`, {
        credentials: "same-origin",
      });
      if (!res.ok) {
        setError("Export failed. Try again.");
        return;
      }

      const disposition = res.headers.get("content-disposition") ?? "";
      const match = /filename="([^"]+)"/.exec(disposition);
      const filename = match?.[1] ?? `language-hub-${dataset}.csv`;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Export failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <GhostButton type="button" onClick={run} disabled={busy}>
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        {busy ? "Preparing…" : label}
      </GhostButton>
      {error && <span className="font-sans text-[0.68rem] text-[#b4432b]">{error}</span>}
    </span>
  );
}
