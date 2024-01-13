-- CreateTable
CREATE TABLE "MessageReact" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "messageId" INTEGER NOT NULL,

    CONSTRAINT "MessageReact_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MessageReact" ADD CONSTRAINT "MessageReact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReact" ADD CONSTRAINT "MessageReact_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
