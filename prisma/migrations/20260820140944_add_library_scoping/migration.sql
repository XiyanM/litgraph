/*
  Warnings:

  - Added the required column `libraryId` to the `Book` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "libraryId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Book_libraryId_idx" ON "Book"("libraryId");
