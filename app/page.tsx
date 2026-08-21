"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CsvImportPanel } from "@/components/CsvImportPanel";

interface Concept { id: string; label: string; }
interface BookConcept { concept: Concept; }
interface Book {
  id: string; title: string; author: string; coverUrl: string | null; concepts: BookConcept[];
}

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [showImport, setShowImport] = useState(false);

  const fetchBooks = () => fetch("/api/books").then((res) => res.json()).then(setBooks);
  useEffect(() => { fetchBooks(); }, []);

  if (!books) {
    return (
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ color: "var(--color-text-muted)", fontSize: 14, textAlign: "center", marginTop: 80 }}>
          Loading your library...
        </p>
      </main>
    );
  }

  const uniqueThemes = new Set(books.flatMap((b) => b.concepts.map((c) => c.concept.id)));

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
      {books.length === 0 ? (
        <div style={{ minHeight: "50vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, fontWeight: 500, margin: 0 }}>
            Your reading, connected.
          </h1>
          <p style={{ color: "var(--color-text-muted)", maxWidth: 420, marginTop: 12, fontSize: 15, lineHeight: 1.6 }}>
            Build a map of the ideas, themes, and connections across the books you read.
          </p>
        </div>
      ) : (
        <>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 24, fontWeight: 500, margin: 0 }}>Your Library</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginTop: 4 }}>
            {books.length} books · {uniqueThemes.size} themes
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 28, marginTop: 32 }}>
            {books.map((book) => (
              <Link key={book.id} href={`/books/${book.id}`} style={{ display: "block" }}>
                <div style={{ aspectRatio: "2 / 3", background: "var(--color-border)", borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
                  {book.coverUrl && <img src={book.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: 14, lineHeight: 1.3 }}>{book.title}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>{book.author}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4 }}>{book.concepts.length} themes</div>
              </Link>
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: 48, textAlign: "center" }}>
        <button
          onClick={() => setShowImport((v) => !v)}
          style={{ fontSize: 13, color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
        >
          Import from Goodreads
        </button>
        {showImport && (
          <div style={{ marginTop: 16, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
            <CsvImportPanel onImported={fetchBooks} />
          </div>
        )}
      </div>
    </main>
  );
}