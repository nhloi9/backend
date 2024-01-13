-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_memberId_fkey";

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "conversation_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
