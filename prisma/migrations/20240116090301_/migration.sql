/*
  Warnings:

  - The values [negative,fake] on the enum `report` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[userId,postId]` on the table `reports` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "report_new" AS ENUM ('violence', 'spam', 'harassment', 'hate', 'nudity', 'false', 'terrorism');
ALTER TABLE "reports" ALTER COLUMN "type" TYPE "report_new" USING ("type"::text::"report_new");
ALTER TYPE "report" RENAME TO "report_old";
ALTER TYPE "report_new" RENAME TO "report";
DROP TYPE "report_old";
COMMIT;

-- CreateIndex
CREATE UNIQUE INDEX "reports_userId_postId_key" ON "reports"("userId", "postId");
