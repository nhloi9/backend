/*
  Warnings:

  - You are about to drop the column `active` on the `conversations` table. All the data in the column will be lost.
  - You are about to drop the column `block` on the `conversations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "conversation_members" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "block" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "conversations" DROP COLUMN "active",
DROP COLUMN "block";
