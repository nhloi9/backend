/*
  Warnings:

  - The values [iviteGroup] on the enum `notify` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `target` on the `notifications` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "notify_new" AS ENUM ('inviteGroup');
ALTER TYPE "notify" RENAME TO "notify_old";
ALTER TYPE "notify_new" RENAME TO "notify";
DROP TYPE "notify_old";
COMMIT;

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "target",
ADD COLUMN     "expandData" JSONB,
ADD COLUMN     "image" TEXT;
