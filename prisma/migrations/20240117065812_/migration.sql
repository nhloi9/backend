-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastOnline" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
