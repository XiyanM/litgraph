import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLibraryId } from "@/lib/libraryId";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const libraryId = getLibraryId(req);

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book || book.libraryId !== libraryId) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  await prisma.book.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
