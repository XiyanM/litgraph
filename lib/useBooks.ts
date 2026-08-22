"use client";

import { useEffect, useState } from "react";

export interface Concept {
  id: string;
  label: string;
}

export interface BookConcept {
  prominence: number;
  rationale: string;
  concept: Concept;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  concepts: BookConcept[];
}

let cache: Book[] | null = null;
const listeners = new Set<(books: Book[]) => void>();

export async function refetchBooks(): Promise<Book[]> {
  const res = await fetch("/api/books");
  const books: Book[] = await res.json();
  cache = books;
  listeners.forEach((l) => l(books));
  return books;
}

export function useBooks() {
  const [books, setBooks] = useState<Book[] | null>(cache);

  useEffect(() => {
    const listener = (b: Book[]) => setBooks(b);
    listeners.add(listener);
    // Only fetch if nothing has ever loaded this session — if the cache
    // is already populated, trust it instead of silently re-fetching (and
    // re-triggering every listener) on every single mount.
    if (cache === null) {
      refetchBooks();
    }
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return { books, refetch: refetchBooks };
}
