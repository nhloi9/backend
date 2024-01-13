/*
  Warnings:

  - You are about to drop the column `locationId` on the `files` table. All the data in the column will be lost.
  - You are about to drop the column `isCheckin` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `locationId` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the `locations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `wish_locations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "files" DROP CONSTRAINT "files_locationId_fkey";

-- DropForeignKey
ALTER TABLE "posts" DROP CONSTRAINT "posts_locationId_fkey";

-- DropForeignKey
ALTER TABLE "wish_locations" DROP CONSTRAINT "wish_locations_locationId_fkey";

-- DropForeignKey
ALTER TABLE "wish_locations" DROP CONSTRAINT "wish_locations_userId_fkey";

-- AlterTable
ALTER TABLE "files" DROP COLUMN "locationId";

-- AlterTable
ALTER TABLE "posts" DROP COLUMN "isCheckin",
DROP COLUMN "locationId",
ADD COLUMN     "feel" JSONB,
ADD COLUMN     "location" JSONB;

-- DropTable
DROP TABLE "locations";

-- DropTable
DROP TABLE "wish_locations";

-- CreateTable
CREATE TABLE "_tag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_tag_AB_unique" ON "_tag"("A", "B");

-- CreateIndex
CREATE INDEX "_tag_B_index" ON "_tag"("B");

-- AddForeignKey
ALTER TABLE "_tag" ADD CONSTRAINT "_tag_A_fkey" FOREIGN KEY ("A") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_tag" ADD CONSTRAINT "_tag_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
