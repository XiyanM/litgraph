"use client";

import { useState } from "react";
import { parseLibraryCsv } from "@/lib/parseLibraryCsv";

type ImportStatus = "idle" | "parsing" | "importing" | "done";

export function CsvImportPanel({ onImported }: { onImported?: () => void }) {
    const [status, setStatus] = useState<ImportStatus>("idle");
    const [total, setTotal] = useState(0);
    const [completed, setCompleted] = useState(0);
    const [skipped, setSkipped] = useState(0);
    const [failed, setFailed] = useState<string[]>([]);

    async function handleFile(file: File) {
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
        <div className="rounded-lg border border-neutral-700 p-4">
            <label className="block text-sm font-medium mb-2">
                Import from Goodreads
            </label>
            <input
                type="file"
                accept=".csv"
                disabled={status === "parsing" || status === "importing"}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                }}
                className="text-sm"
            />
            {status === "parsing" && <p className="text-sm mt-2">Reading file...</p>}
            {status === "importing" && (
                <p className="text-sm mt-2">
                    Importing {completed}/{total}... ({skipped} already in library)
                </p>
            )}
            {status === "done" && (
                <p className="text-sm mt-2">
                    Done — {completed - skipped - failed.length} added, {skipped} skipped
                    {failed.length > 0 && `, ${failed.length} failed`}
                </p>
            )}
            {failed.length > 0 && (
                <p className="text-xs text-red-400 mt-1">Failed: {failed.join(", ")}</p>
            )}
        </div>
    );
}