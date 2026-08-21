"use client";

import { useState, useRef } from "react";
import { parseLibraryCsv } from "@/lib/parseLibraryCsv";

type ImportStatus = "idle" | "parsing" | "importing" | "done";

export function CsvImportPanel({ onImported }: { onImported?: () => void }) {
    const [status, setStatus] = useState<ImportStatus>("idle");
    const [total, setTotal] = useState(0);
    const [completed, setCompleted] = useState(0);
    const [skipped, setSkipped] = useState(0);
    const [failed, setFailed] = useState<string[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const busy = status === "parsing" || status === "importing";

    async function handleFile(file: File) {
        setFileName(file.name);
        setStatus("parsing");
        const rows = await parseLibraryCsv(file);
        setTotal(rows.length);
        setCompleted(0);
        setSkipped(0);
        setFailed([]);
        setStatus("importing");

        for (const row of rows) {
            try {
                const res = await fetch("/api/books", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title: row.title, author: row.author }),
                });
                if (res.status === 409) setSkipped((s) => s + 1);
                else if (!res.ok) setFailed((f) => [...f, row.title]);
            } catch {
                setFailed((f) => [...f, row.title]);
            }
            setCompleted((c) => c + 1);
        }

        setStatus("done");
        onImported?.();
    }

    return (
        <div style={{ border: "1px solid var(--color-border)", borderRadius: 10, padding: 20, textAlign: "left", background: "var(--color-surface)" }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text)", marginBottom: 4 }}>
                Import from Goodreads
            </div>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 14px 0", lineHeight: 1.5 }}>
                Upload your Goodreads library export (.csv). Only books marked "read" are imported.
            </p>

            <input
                ref={inputRef}
                type="file"
                accept=".csv"
                disabled={busy}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                }}
                style={{ display: "none" }}
            />

            <button
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                style={{
                    fontSize: 13,
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: "1px solid var(--color-border)",
                    background: busy ? "var(--color-bg)" : "var(--color-surface)",
                    color: busy ? "var(--color-text-muted)" : "var(--color-text)",
                    cursor: busy ? "default" : "pointer",
                }}
            >
                Choose file
            </button>
            {fileName && (
                <span style={{ fontSize: 12, color: "var(--color-text-muted)", marginLeft: 10 }}>
                    {fileName}
                </span>
            )}

            {status === "parsing" && <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 12 }}>Reading file...</p>}
            {status === "importing" && (
                <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 12 }}>
                    Importing {completed}/{total}... ({skipped} already in library)
                </p>
            )}
            {status === "done" && (
                <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 12 }}>
                    Done — {completed - skipped - failed.length} added, {skipped} skipped
                    {failed.length > 0 && `, ${failed.length} failed`}
                </p>
            )}
            {failed.length > 0 && <p style={{ fontSize: 12, color: "#b3261e", marginTop: 4 }}>Failed: {failed.join(", ")}</p>}
        </div>
    );
}