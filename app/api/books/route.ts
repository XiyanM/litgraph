// app/api/books/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveBookMetadata } from "@/lib/metadata";
import { resolveWikipediaEnrichment } from "@/lib/wikipedia";

export async function GET() {
  const books = await prisma.book.findMany({ orderBy: { createdAt: "desc" } });
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

  const metadata = await resolveBookMetadata(title, author, workKey);
  const wiki = await resolveWikipediaEnrichment(title, author);

  const book = await prisma.book.create({
    data: {
      title,
      author,
      description: description || metadata.description,
      subjects: metadata.subjects,
      coverUrl: metadata.coverUrl,
      wikipediaExcerpt: wiki?.excerpt ?? null,
      sourceConfidence: wiki ? "wikipedia" : "metadata-only",
    },
  });

  return NextResponse.json(book, { status: 201 });
}
