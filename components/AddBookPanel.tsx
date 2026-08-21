"use client";

import { useEffect, useState } from "react";
import { refetchBooks } from "@/lib/useBooks";

interface Suggestion {
    title: string;
    author: string;
    workKey: string;
    coverUrl: string | null;
}

export function AddBookPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        if (!open) {
            setQuery("");
            setSuggestions([]);
            setAdding(false);
        }
    }, [open]);

    useEffect(() => {
        if (adding) return;
        if (query.trim().length < 2) {
            setSuggestions([]);
            return;
        }
        const timeout = setTimeout(async () => {
            const res = await fetch(`/api/search-books?q=${encodeURIComponent(query)}`);
            setSuggestions(await res.json());
        }, 300);
        return () => clearTimeout(timeout);
    }, [query, adding]);

    async function handleAdd(s: Suggestion) {
        setAdding(true);
        const res = await fetch("/api/books", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: s.title, author: s.author, workKey: s.workKey }),
        });
        if (res.ok) await refetchBooks();
        setAdding(false);
        onClose();
    }

    if (!open) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(24,24,24,0.35)",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                paddingTop: 120,
                zIndex: 100,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: 560,
                    maxWidth: "90vw",
                    background: "var(--color-surface)",
                    borderRadius: 10,
                    border: "1px solid var(--color-border)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
                    overflow: "hidden",
                }}
            >
                <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={adding ? "Adding..." : "Search Google Books..."}
                    disabled={adding}
                    style={{
                        width: "100%",
                        padding: "16px 20px",
                        fontSize: 15,
                        border: "none",
                        borderBottom: suggestions.length ? "1px solid var(--color-border)" : "none",
                        outline: "none",
                        background: "transparent",
                        color: "var(--color-text)",
                    }}
                />
                {suggestions.length > 0 && (
                    <div
                        style={{
                            maxHeight: 360,
                            overflowY: "auto",
                            pointerEvents: adding ? "none" : "auto",
                            opacity: adding ? 0.5 : 1,
                        }}
                    >
                        {suggestions.map((s) => (
                            <div
                                key={s.workKey}
                                onClick={() => handleAdd(s)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "10px 20px",
                                    cursor: "pointer",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                                {s.coverUrl ? (
                                    <img src={s.coverUrl} alt="" style={{ width: 28, height: 42, objectFit: "cover", borderRadius: 2 }} />
                                ) : (
                                    <div style={{ width: 28, height: 42, background: "var(--color-bg)", borderRadius: 2 }} />
                                )}
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 500 }}>{s.title}</div>
                                    <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{s.author}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}