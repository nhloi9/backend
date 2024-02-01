-- CreateTable
CREATE TABLE "_view" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_view_AB_unique" ON "_view"("A", "B");

-- CreateIndex
CREATE INDEX "_view_B_index" ON "_view"("B");

-- AddForeignKey
ALTER TABLE "_view" ADD CONSTRAINT "_view_A_fkey" FOREIGN KEY ("A") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_view" ADD CONSTRAINT "_view_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
