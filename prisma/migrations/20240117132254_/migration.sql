-- AlterTable
ALTER TABLE "onlineUser" ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "onlineUser_pkey" PRIMARY KEY ("id");
