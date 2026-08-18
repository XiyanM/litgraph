-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "description" TEXT,
    "subjects" TEXT[],
    "coverUrl" TEXT,
    "sourceConfidence" TEXT NOT NULL DEFAULT 'metadata-only',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Concept" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "Concept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookConcept" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "prominence" INTEGER NOT NULL,
    "rationale" TEXT NOT NULL,

    CONSTRAINT "BookConcept_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Concept_label_key" ON "Concept"("label");

-- CreateIndex
CREATE UNIQUE INDEX "BookConcept_bookId_conceptId_key" ON "BookConcept"("bookId", "conceptId");

-- AddForeignKey
ALTER TABLE "BookConcept" ADD CONSTRAINT "BookConcept_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookConcept" ADD CONSTRAINT "BookConcept_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;
