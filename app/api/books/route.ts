// app/api/books/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const books = await prisma.book.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(books);
}

export async function POST(req: NextRequest) {
  const { title, author, description } = await req.json();

  if (!title || !author) {
    return NextResponse.json(
      { error: "Title and author are required" },
      { status: 400 }
    );
  }

  const book = await prisma.book.create({
    data: { title, author, description: description || null },
  });

  return NextResponse.json(book, { status: 201 });
}
