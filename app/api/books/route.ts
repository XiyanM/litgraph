// app/api/books/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveBookMetadata } from "@/lib/metadata";
import { resolveWikipediaEnrichment } from "@/lib/wikipedia";
import { extractConcepts } from "@/lib/concepts";
import { resolveConcept } from "@/lib/normalizeConcept";

export const maxDuration = 60;

export async function GET() {
  const books = await prisma.book.findMany({
    orderBy: { createdAt: "desc" },
    include: { concepts: { include: { concept: true } } },
  });
  return NextResponse.json(books);
}

export async function POST(req: NextRequest) {
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

  const metadata = await resolveBookMetadata(
    normalizedTitle,
    normalizedAuthor,
    workKey
  );

  const wiki = await resolveWikipediaEnrichment(
    normalizedTitle,
    normalizedAuthor
  );

  const book = await prisma.book.create({
    data: {
      title: normalizedTitle,
      author: normalizedAuthor,
      description: description || metadata.description,
      subjects: metadata.subjects,
      coverUrl: metadata.coverUrl,
      wikipediaExcerpt: wiki?.excerpt ?? null,
      sourceConfidence: wiki ? "wikipedia" : "metadata-only",
    },
  });

  // Book is already saved at this point — if extraction fails, we keep the
  // book with zero concepts rather than losing it entirely.
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
      await prisma.bookConcept.create({
        data: {
          bookId: book.id,
          conceptId: concept.id,
          prominence: c.prominence,
          rationale: c.rationale,
        },
      });
    }
  }

  const bookWithConcepts = await prisma.book.findUnique({
    where: { id: book.id },
    include: { concepts: { include: { concept: true } } },
  });

  return NextResponse.json(bookWithConcepts, { status: 201 });
}
