/*
  Warnings:

  - You are about to drop the `_mesBlock` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_mesBlock" DROP CONSTRAINT "_mesBlock_A_fkey";

-- DropForeignKey
ALTER TABLE "_mesBlock" DROP CONSTRAINT "_mesBlock_B_fkey";

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "block" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "_mesBlock";
