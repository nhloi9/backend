-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_receiverId_fkey";

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
