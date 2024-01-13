/*
  Warnings:

  - You are about to drop the column `approved` on the `posts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "requireApproval" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "posts" DROP COLUMN "approved",
ALTER COLUMN "accepted" DROP NOT NULL;
