import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveBookMetadata } from "@/lib/metadata";
import { resolveWikipediaEnrichment } from "@/lib/wikipedia";
import { extractConcepts } from "@/lib/concepts";
import { resolveConcept } from "@/lib/normalizeConcept";
import { getLibraryId } from "@/lib/libraryId";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const libraryId = getLibraryId(req);
  const books = await prisma.book.findMany({
    where: { libraryId: libraryId ?? "__none__" },
    orderBy: { createdAt: "desc" },
    include: { concepts: { include: { concept: true } } },
  });
  return NextResponse.json(books);
}

export async function POST(req: NextRequest) {
  const libraryId = getLibraryId(req);
  if (!libraryId) {
    return NextResponse.json(
      { error: "Missing library session." },
      { status: 400 }
    );
  }

  const { title, author, description, workKey } = await req.json();
  if (!title || !author) {
    return NextResponse.json(
      { error: "Title and author are required" },
      { status: 400 }
    );
  }

  const normalizedTitle = title.trim();
  const normalizedAuthor = author.trim();

  const existing = await prisma.book.findFirst({
    where: {
      libraryId,
      title: { equals: normalizedTitle, mode: "insensitive" },
      author: { equals: normalizedAuthor, mode: "insensitive" },
    },
  });

  if (existing) {
    return NextResponse.json(
      {
        error: `"${normalizedTitle}" by ${normalizedAuthor} is already in your library.`,
      },
      { status: 409 }
    );
  }

  const [metadata, wiki] = await Promise.all([
    resolveBookMetadata(normalizedTitle, normalizedAuthor, workKey),
    resolveWikipediaEnrichment(normalizedTitle, normalizedAuthor),
  ]);

  const book = await prisma.book.create({
    data: {
      libraryId,
      title: normalizedTitle,
      author: normalizedAuthor,
      description: description || metadata.description,
      subjects: metadata.subjects,
      coverUrl: metadata.coverUrl,
      wikipediaExcerpt: wiki?.excerpt ?? null,
      sourceConfidence: wiki ? "wikipedia" : "metadata-only",
    },
  });

  const extracted = await extractConcepts({
    title: book.title,
    author: book.author,
    description: book.description,
    subjects: book.subjects,
    wikipediaExcerpt: book.wikipediaExcerpt,
  });

  if (extracted) {
    for (const c of extracted) {
      const concept = await resolveConcept(c.label);
      // Two different extracted labels can legitimately normalize to the
      // same concept for one book — upsert so the second one is a silent
      // no-op instead of crashing the whole request.
      await prisma.bookConcept.upsert({
        where: { bookId_conceptId: { bookId: book.id, conceptId: concept.id } },
        create: {
          bookId: book.id,
          conceptId: concept.id,
          prominence: c.prominence,
          rationale: c.rationale,
        },
        update: {},
      });
    }
  }

  const bookWithConcepts = await prisma.book.findUnique({
    where: { id: book.id },
    include: { concepts: { include: { concept: true } } },
  });

  return NextResponse.json(bookWithConcepts, { status: 201 });
}
