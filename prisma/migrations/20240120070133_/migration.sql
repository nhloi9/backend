/*
  Warnings:

  - A unique constraint covering the columns `[conversationId]` on the table `files` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "files" ADD COLUMN     "conversationId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "files_conversationId_key" ON "files"("conversationId");

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
