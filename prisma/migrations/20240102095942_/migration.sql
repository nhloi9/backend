-- CreateTable
CREATE TABLE "story_texts" (
    "id" SERIAL NOT NULL,
    "storyId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "story_texts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "story_texts" ADD CONSTRAINT "story_texts_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
