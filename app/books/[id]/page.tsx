"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBooks } from "@/lib/useBooks";

export default function BookDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { books } = useBooks();

    const [confirmingDelete, setConfirmingDelete] = useState(false);

    async function handleDelete() {
        await fetch(`/api/books/${id}`, { method: "DELETE" });
        router.push("/");
    }

    if (!books) {
        return (
            <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px" }}>
                <p style={{ color: "var(--color-text-muted)", fontSize: 14, textAlign: "center", marginTop: 80 }}>
                    Loading...
                </p>
            </main>
        );
    }

    const book = books.find((b) => b.id === id);
    if (!book) {
        return <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px" }}><p style={{ color: "var(--color-text-muted)" }}>Book not found.</p></main>;
    }

    const conceptIds = new Set(book.concepts.map((c) => c.concept.id));
    const connectedBooks = books.filter((b) => b.id !== book.id && b.concepts.some((c) => conceptIds.has(c.concept.id)));
    const maxProminence = Math.max(...book.concepts.map((c) => c.prominence), 1);

    return (
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px" }}>
            <button onClick={() => router.push("/")} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "var(--color-text-muted)", padding: 0, marginBottom: 32 }}>
                ← Library
            </button>
            <div style={{ display: "flex", gap: 24 }}>
                <div style={{ width: 120, aspectRatio: "2 / 3", background: "var(--color-border)", borderRadius: 4, overflow: "hidden", flexShrink: 0 }}>
                    {book.coverUrl && <img src={book.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <div>
                    <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 26, fontWeight: 500, margin: 0 }}>{book.title}</h1>
                    <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginTop: 4 }}>{book.author}</p>
                </div>
            </div>
            <div style={{ marginTop: 40, borderTop: "1px solid var(--color-border)", paddingTop: 24 }}>
                <div style={{ fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 16 }}>Themes</div>
                {book.concepts.sort((a, b) => b.prominence - a.prominence).map((bc) => (
                    <div key={bc.concept.id} style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 14 }}>{bc.concept.label}</div>
                        <div style={{ height: 4, background: "var(--color-border)", borderRadius: 2, marginTop: 6 }}>
                            <div style={{ height: "100%", width: `${(bc.prominence / maxProminence) * 100}%`, background: "var(--color-accent)", borderRadius: 2 }} />
                        </div>
                        <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 6, lineHeight: 1.5 }}>{bc.rationale}</div>
                    </div>
                ))}
            </div>
            {connectedBooks.length > 0 && (
                <div style={{ marginTop: 32, borderTop: "1px solid var(--color-border)", paddingTop: 24 }}>
                    <div style={{ fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 12 }}>Connected Books</div>
                    {connectedBooks.map((b) => (
                        <div key={b.id} onClick={() => router.push(`/books/${b.id}`)} style={{ fontSize: 14, marginBottom: 8, cursor: "pointer" }}>{b.title}</div>
                    ))}
                </div>
            )}

            <div style={{ marginTop: 32, borderTop: "1px solid var(--color-border)", paddingTop: 24 }}>
                <button
                    onClick={() => setConfirmingDelete(true)}
                    style={{ fontSize: 13, color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
                >
                    Remove from library
                </button>
            </div>

            {confirmingDelete && (
                <div
                    onClick={() => setConfirmingDelete(false)}
                    style={{ position: "fixed", inset: 0, background: "rgba(24,24,24,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: 340, background: "var(--color-surface)", borderRadius: 10, border: "1px solid var(--color-border)", boxShadow: "0 20px 60px rgba(0,0,0,0.12)", padding: 24 }}
                    >
                        <p style={{ fontFamily: "var(--font-serif)", fontSize: 16, margin: 0, lineHeight: 1.5 }}>
                            Remove "{book.title}" from your library?
                        </p>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
                            <button
                                onClick={() => setConfirmingDelete(false)}
                                style={{ fontSize: 13, color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", padding: "6px 4px" }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                style={{ fontSize: 13, color: "#b3261e", background: "none", border: "none", cursor: "pointer", padding: "6px 4px", fontWeight: 500 }}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}